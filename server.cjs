const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const uploadsVehiclesDir = path.join(__dirname, 'uploads', 'vehicles');
const dataDir = path.join(__dirname, 'data');
const catalogFile = path.join(dataDir, 'vehicles.json');

// Ensure directories exist
if (!fs.existsSync(uploadsVehiclesDir)) {
  fs.mkdirSync(uploadsVehiclesDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function sanitizeId(id) {
  return String(id || '').replace(/[^a-zA-Z0-9_-]/g, '');
}

function readCatalog() {
  if (fs.existsSync(catalogFile)) {
    try {
      const raw = fs.readFileSync(catalogFile, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.warn('Error parsing catalog file, attempting rebuild:', e);
    }
  }

  // Fallback: Rebuild from folders
  const vehicles = [];
  if (fs.existsSync(uploadsVehiclesDir)) {
    const folders = fs.readdirSync(uploadsVehiclesDir);
    for (const folder of folders) {
      const vFile = path.join(uploadsVehiclesDir, folder, 'vehicle.json');
      if (fs.existsSync(vFile)) {
        try {
          const vData = JSON.parse(fs.readFileSync(vFile, 'utf8'));
          if (vData && vData.id) vehicles.push(vData);
        } catch (e) {}
      }
    }
  }
  fs.writeFileSync(catalogFile, JSON.stringify(vehicles, null, 2), 'utf8');
  return vehicles;
}

function saveCatalog(vehicles) {
  fs.writeFileSync(catalogFile, JSON.stringify(vehicles, null, 2), 'utf8');
}

const server = http.createServer((req, res) => {
  // Common CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  const reqPath = decodeURI(urlObj.pathname);

  // API Route: /api/vehicles or /api/vehicles.php
  if (reqPath === '/api/vehicles' || reqPath === '/api/vehicles.php') {
    // GET: Retrieve vehicles or single vehicle
    if (req.method === 'GET') {
      const queryId = urlObj.searchParams.get('id');
      if (queryId) {
        const cleanId = sanitizeId(queryId);
        const vFile = path.join(uploadsVehiclesDir, cleanId, 'vehicle.json');
        if (fs.existsSync(vFile)) {
          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
          res.end(fs.readFileSync(vFile, 'utf8'));
          return;
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Vehicle folder not found', id: cleanId }));
          return;
        }
      }

      const list = readCatalog();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
      res.end(JSON.stringify(list, null, 2));
      return;
    }

    // DELETE or POST ?action=delete
    if (req.method === 'DELETE' || (req.method === 'POST' && urlObj.searchParams.get('action') === 'delete')) {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        let carId = urlObj.searchParams.get('id');
        if (!carId && body) {
          try {
            const parsed = JSON.parse(body);
            carId = parsed.id;
          } catch (e) {}
        }

        if (!carId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing vehicle id' }));
          return;
        }

        const cleanId = sanitizeId(carId);
        const vehicleFolder = path.join(uploadsVehiclesDir, cleanId);

        if (fs.existsSync(vehicleFolder)) {
          fs.rmSync(vehicleFolder, { recursive: true, force: true });
        }

        const catalog = readCatalog();
        const updated = catalog.filter(v => v && sanitizeId(v.id) !== cleanId);
        saveCatalog(updated);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          id: cleanId,
          message: `Vehicle folder 'uploads/vehicles/${cleanId}/' deleted successfully.`
        }));
      });
      return;
    }

    // POST: Save vehicle & write photos into dedicated folder
    if (req.method === 'POST') {
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => {
        try {
          const raw = Buffer.concat(chunks).toString('utf8');
          const payload = JSON.parse(raw);
          const vehicle = payload.vehicle || payload;

          if (!vehicle.id) {
            vehicle.id = `veh-${Date.now()}`;
          }

          const cleanId = sanitizeId(vehicle.id);
          const vehicleFolder = path.join(uploadsVehiclesDir, cleanId);

          if (!fs.existsSync(vehicleFolder)) {
            fs.mkdirSync(vehicleFolder, { recursive: true });
          }

          // Process images
          const processedImages = [];
          const rawImages = Array.isArray(vehicle.images) ? vehicle.images : [];

          rawImages.forEach((img, idx) => {
            if (typeof img !== 'string' || !img.trim()) return;

            const base64Match = img.match(/^data:image\/(\w+);base64,(.+)$/);
            if (base64Match) {
              let ext = base64Match[1].toLowerCase();
              if (ext === 'jpeg') ext = 'jpg';
              if (!['jpg', 'png', 'webp', 'gif'].includes(ext)) ext = 'jpg';

              const buffer = Buffer.from(base64Match[2], 'base64');
              const fileName = `photo_${idx + 1}.${ext}`;
              const filePath = path.join(vehicleFolder, fileName);
              fs.writeFileSync(filePath, buffer);

              processedImages.push(`uploads/vehicles/${cleanId}/${fileName}`);
            } else {
              processedImages.push(img);
            }
          });

          if (processedImages.length === 0) {
            processedImages.push('images/slide1.jpg');
          }

          vehicle.images = processedImages;
          vehicle.id = cleanId;
          vehicle.updatedAt = new Date().toISOString();

          // Save vehicle.json inside dedicated folder
          fs.writeFileSync(
            path.join(vehicleFolder, 'vehicle.json'),
            JSON.stringify(vehicle, null, 2),
            'utf8'
          );

          // Update central catalog
          const catalog = readCatalog();
          const existingIndex = catalog.findIndex(v => v && sanitizeId(v.id) === cleanId);
          if (existingIndex > -1) {
            catalog[existingIndex] = vehicle;
          } else {
            catalog.unshift(vehicle);
          }
          saveCatalog(catalog);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            vehicle,
            folder: `uploads/vehicles/${cleanId}/`,
            message: `Vehicle stored successfully in folder uploads/vehicles/${cleanId}/`
          }));
        } catch (err) {
          console.error('Error saving vehicle:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }
  }

  // Static File Serving
  let filePath = path.join(__dirname, reqPath === '/' ? '/index.html' : reqPath);

  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/ (Vehicle API active on /api/vehicles.php)`);
});
