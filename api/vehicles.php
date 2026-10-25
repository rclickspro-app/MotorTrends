<?php
/**
 * Motor Trends Auto Group - Vehicle Storage & File Manager API
 * Compatible with HostPapa cPanel PHP & Apache File Manager
 * Stores each vehicle in its own folder: uploads/vehicles/{vehicle_id}/
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight CORS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

@ini_set('upload_max_filesize', '64M');
@ini_set('post_max_size', '64M');
@ini_set('memory_limit', '256M');

$rootDir = realpath(__DIR__ . '/..');
$uploadsVehiclesDir = $rootDir . '/uploads/vehicles';
$dataDir = $rootDir . '/data';
$catalogFile = $dataDir . '/vehicles.json';

// Ensure required root directories exist
if (!is_dir($uploadsVehiclesDir)) {
    @mkdir($uploadsVehiclesDir, 0755, true);
}
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}

// Helper: Read central catalog from physical folders in uploads/vehicles/
function readCatalog($catalogFile, $uploadsVehiclesDir) {
    $vehiclesMap = [];

    // 1. Scan physical folders in uploads/vehicles/ (primary source of truth)
    if (is_dir($uploadsVehiclesDir)) {
        $folders = scandir($uploadsVehiclesDir);
        foreach ($folders as $folder) {
            if ($folder === '.' || $folder === '..') continue;
            $folderPath = $uploadsVehiclesDir . '/' . $folder;
            if (!is_dir($folderPath)) continue;

            $cleanId = sanitizeId($folder);
            $vFile = $folderPath . '/vehicle.json';
            $vData = null;
            if (file_exists($vFile)) {
                $raw = @file_get_contents($vFile);
                $vData = json_decode($raw, true);
            }

            // Scan image files inside this vehicle folder
            $allFiles = scandir($folderPath);
            $imageFiles = [];
            foreach ($allFiles as $f) {
                if (preg_match('/\.(jpe?g|png|webp|gif)$/i', $f)) {
                    $imageFiles[] = 'uploads/vehicles/' . $folder . '/' . $f;
                }
            }

            // Sort natural order (photo_1.jpg before photo_2.jpg)
            natsort($imageFiles);
            $imageFiles = array_values($imageFiles);

            if (is_array($vData) && !empty($vData['id'])) {
                if (!empty($imageFiles)) {
                    $vData['images'] = $imageFiles;
                } elseif (empty($vData['images'])) {
                    $vData['images'] = ['images/slide1.jpg'];
                }
                $vehiclesMap[(string)$vData['id']] = $vData;
            } elseif (!empty($imageFiles)) {
                $vehiclesMap[$cleanId] = [
                    'id' => $cleanId,
                    'year' => (int)date('Y'),
                    'make' => 'Vehicle',
                    'model' => $cleanId,
                    'price' => 0,
                    'mileage' => 0,
                    'bodyType' => 'Sedan',
                    'fuelType' => 'Gasoline',
                    'condition' => 'Pre-Owned',
                    'featured' => true,
                    'isNewVehicle' => true,
                    'images' => $imageFiles,
                    'createdAt' => date('c')
                ];
            }
        }
    }

    // 2. Also check catalogFile for extra metadata
    if (file_exists($catalogFile)) {
        $raw = @file_get_contents($catalogFile);
        $parsed = json_decode($raw, true);
        if (is_array($parsed)) {
            foreach ($parsed as $item) {
                if (isset($item['id'])) {
                    $strId = (string)$item['id'];
                    if (!isset($vehiclesMap[$strId])) {
                        if (is_dir($uploadsVehiclesDir . '/' . $strId)) {
                            $vehiclesMap[$strId] = $item;
                        }
                    } else {
                        $vehiclesMap[$strId] = array_merge($item, $vehiclesMap[$strId]);
                    }
                }
            }
        }
    }

    $vehicles = array_values($vehiclesMap);

    // Sort: Newest additions first
    usort($vehicles, function($a, $b) {
        $timeA = isset($a['createdAt']) ? strtotime($a['createdAt']) : 0;
        $timeB = isset($b['createdAt']) ? strtotime($b['createdAt']) : 0;
        return $timeB - $timeA;
    });

    @file_put_contents($catalogFile, json_encode($vehicles, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    return $vehicles;
}

// Helper: Save central catalog
function saveCatalog($catalogFile, $vehicles) {
    return @file_put_contents($catalogFile, json_encode(array_values($vehicles), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

// Helper: Recursively delete a directory
function deleteDirectory($dir) {
    if (!file_exists($dir)) return true;
    if (!is_dir($dir)) return @unlink($dir);
    foreach (scandir($dir) as $item) {
        if ($item == '.' || $item == '..') continue;
        if (!deleteDirectory($dir . DIRECTORY_SEPARATOR . $item)) return false;
    }
    return @rmdir($dir);
}

// Helper: Sanitize folder name
function sanitizeId($id) {
    return preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$id);
}

$method = $_SERVER['REQUEST_METHOD'];

// Handle GET: Retrieve vehicle catalog or a single vehicle
if ($method === 'GET') {
    if (!empty($_GET['id'])) {
        $cleanId = sanitizeId($_GET['id']);
        $vFile = $uploadsVehiclesDir . '/' . $cleanId . '/vehicle.json';
        if (file_exists($vFile)) {
            echo file_get_contents($vFile);
            exit;
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Vehicle folder not found', 'id' => $cleanId]);
            exit;
        }
    }

    $vehicles = readCatalog($catalogFile, $uploadsVehiclesDir);
    echo json_encode($vehicles, JSON_UNESCAPED_SLASHES);
    exit;
}

// Handle DELETE: Delete a vehicle folder and remove from catalog
if ($method === 'DELETE' || ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'delete')) {
    $rawInput = file_get_contents('php://input');
    $inputData = json_decode($rawInput, true);

    $carId = $_GET['id'] ?? ($inputData['id'] ?? null);
    if (!$carId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing vehicle id']);
        exit;
    }

    $cleanId = sanitizeId($carId);
    $vehicleFolder = $uploadsVehiclesDir . '/' . $cleanId;

    if (is_dir($vehicleFolder)) {
        deleteDirectory($vehicleFolder);
    }

    $catalog = readCatalog($catalogFile, $uploadsVehiclesDir);
    $updated = array_filter($catalog, function($v) use ($cleanId) {
        return isset($v['id']) && sanitizeId($v['id']) !== $cleanId;
    });
    saveCatalog($catalogFile, $updated);

    echo json_encode([
        'success' => true,
        'id' => $cleanId,
        'message' => "Vehicle folder 'uploads/vehicles/{$cleanId}/' deleted successfully from HostPapa storage."
    ]);
    exit;
}

// Handle POST: Add or Update vehicle and store photos in uploads/vehicles/{id}/
if ($method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $inputData = json_decode($rawInput, true);

    if (!is_array($inputData)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON payload received']);
        exit;
    }

    $vehicle = isset($inputData['vehicle']) && is_array($inputData['vehicle'])
        ? $inputData['vehicle']
        : $inputData;

    if (empty($vehicle['id'])) {
        $vehicle['id'] = 'veh-' . round(microtime(true) * 1000);
    }

    $cleanId = sanitizeId($vehicle['id']);
    if (empty($cleanId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid vehicle id provided']);
        exit;
    }

    $vehicleFolder = $uploadsVehiclesDir . '/' . $cleanId;
    if (!is_dir($vehicleFolder)) {
        @mkdir($vehicleFolder, 0755, true);
    }

    // Process and extract photos into physical files inside vehicle's folder
    $processedImages = [];
    $rawImages = isset($vehicle['images']) && is_array($vehicle['images']) ? $vehicle['images'] : [];

    foreach ($rawImages as $idx => $img) {
        if (!is_string($img) || empty(trim($img))) continue;

        // Check for base64 image data (e.g., data:image/jpeg;base64,....)
        if (preg_match('/^data:image\/(\w+);base64,(.+)$/', $img, $matches)) {
            $ext = strtolower($matches[1]);
            if ($ext === 'jpeg') $ext = 'jpg';
            if (!in_array($ext, ['jpg', 'png', 'webp', 'gif'])) $ext = 'jpg';

            $base64Data = $matches[2];
            $binaryData = base64_decode($base64Data);

            if ($binaryData !== false) {
                $fileName = 'photo_' . ($idx + 1) . '.' . $ext;
                $destPath = $vehicleFolder . '/' . $fileName;
                @file_put_contents($destPath, $binaryData);
                $processedImages[] = 'uploads/vehicles/' . $cleanId . '/' . $fileName;
                continue;
            }
        }

        // If it's already a relative path or external URL, keep as is
        $processedImages[] = $img;
    }

    // Default fallback image if none provided
    if (empty($processedImages)) {
        $processedImages[] = 'images/slide1.jpg';
    }

    $vehicle['images'] = $processedImages;
    $vehicle['id'] = $cleanId;
    $vehicle['updatedAt'] = date('c');

    // 1. Save metadata inside the vehicle's dedicated folder
    $metadataFile = $vehicleFolder . '/vehicle.json';
    @file_put_contents($metadataFile, json_encode($vehicle, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

    // 2. Update central catalog
    $catalog = readCatalog($catalogFile, $uploadsVehiclesDir);
    $found = false;
    foreach ($catalog as $i => $existing) {
        if (isset($existing['id']) && sanitizeId($existing['id']) === $cleanId) {
            $catalog[$i] = $vehicle;
            $found = true;
            break;
        }
    }
    if (!$found) {
        array_unshift($catalog, $vehicle);
    }
    saveCatalog($catalogFile, $catalog);

    echo json_encode([
        'success' => true,
        'vehicle' => $vehicle,
        'folder' => 'uploads/vehicles/' . $cleanId . '/',
        'message' => "Vehicle stored successfully in dedicated folder: uploads/vehicles/{$cleanId}/"
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method Not Allowed']);
