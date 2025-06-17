// scripts/checkRoutes.js - SCRIPT PARA VERIFICAR RUTAS PROBLEMÁTICAS
import fs from 'fs';
import path from 'path';

const routesDir = './routes';

// Patrones problemáticos que pueden causar path-to-regexp errors
const problematicPatterns = [
  /router\.(get|post|put|delete|patch)\(['"`].*:[^)]*\)/g, // Parámetros mal formados
  /router\.(get|post|put|delete|patch)\(['"`].*\*.*[^)]/g, // Wildcards mal formados
  /router\.(get|post|put|delete|patch)\(['"`].*\(.*[^)]/g, // Paréntesis no balanceados
  /router\.(get|post|put|delete|patch)\(['"`].*\[.*[^)]/g, // Corchetes mal formados
];

console.log('🔍 Verificando rutas en busca de errores path-to-regexp...\n');

// Función para verificar un archivo
function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    let hasIssues = false;

    console.log(`📁 Verificando: ${fileName}`);

    // Buscar patrones problemáticos
    problematicPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        hasIssues = true;
        console.log(`  ⚠️  Patrón problemático ${index + 1} encontrado:`);
        matches.forEach(match => {
          console.log(`     ${match}`);
        });
      }
    });

    // Verificar rutas con parámetros
    const routeMatches = content.match(/router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g);
    if (routeMatches) {
      routeMatches.forEach(match => {
        const routePath = match.match(/['"`]([^'"`]+)['"`]/)[1];
        
        // Verificar patrones específicos problemáticos
        if (routePath.includes(':') && !routePath.match(/^\/[a-zA-Z0-9\-_\/]*:[a-zA-Z0-9\-_]+$/)) {
          console.log(`  ❌ Ruta sospechosa: ${routePath}`);
          hasIssues = true;
        }
        
        if (routePath.includes('*') && !routePath.endsWith('*')) {
          console.log(`  ❌ Wildcard mal posicionado: ${routePath}`);
          hasIssues = true;
        }
        
        if (routePath.includes('(') || routePath.includes('[')) {
          console.log(`  ❌ Caracteres especiales problemáticos: ${routePath}`);
          hasIssues = true;
        }
      });
    }

    if (!hasIssues) {
      console.log(`  ✅ Sin problemas detectados`);
    }

    console.log('');
    return hasIssues;

  } catch (error) {
    console.log(`  ❌ Error leyendo archivo: ${error.message}`);
    return true;
  }
}

// Verificar todos los archivos de rutas
try {
  const files = fs.readdirSync(routesDir);
  let totalIssues = 0;

  files.forEach(file => {
    if (file.endsWith('.js')) {
      const filePath = path.join(routesDir, file);
      const hasIssues = checkFile(filePath);
      if (hasIssues) totalIssues++;
    }
  });

  console.log('📊 RESUMEN:');
  if (totalIssues === 0) {
    console.log('✅ No se encontraron problemas en las rutas');
  } else {
    console.log(`❌ Se encontraron problemas en ${totalIssues} archivo(s)`);
    console.log('\n🔧 RECOMENDACIONES PARA SOLUCIONAR:');
    console.log('1. Verifica que los parámetros de ruta tengan formato: /ruta/:parametro');
    console.log('2. Asegúrate de que los wildcards (*) estén al final: /ruta/*');
    console.log('3. Evita caracteres especiales como (, ), [, ] en las rutas');
    console.log('4. Usa solo letras, números, guiones y barras en las rutas');
  }

} catch (error) {
  console.log('❌ Error accediendo al directorio de rutas:', error.message);
  console.log('Asegúrate de que existe el directorio ./routes/');
}

console.log('\n🚀 Para probar rutas específicas:');
console.log('- GET /api/webpay/health');
console.log('- POST /api/webpay/crear-transaccion');
console.log('- GET /api/webpay/confirmar-pago?token_ws=abc123');
console.log('- GET /api/webpay/estado/token123');