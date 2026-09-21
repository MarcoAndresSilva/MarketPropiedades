// Usado solo por el job de Lighthouse en CI: build con las mismas optimizaciones de
// producción (minificado, sin sourcemaps) pero apuntando al backend local que el CI
// levanta contra Postgres, no al backend real de producción — auditar performance con
// un build sin optimizar (como environment.development.ts) infla artificialmente el
// tamaño del JS y da un puntaje que no refleja nada real.
export const environment = {
  apiUrl: 'http://localhost:3002',
  siteUrl: 'http://localhost:4000',
  cloudinaryCloudName: 'dev-test-cloud',
};
