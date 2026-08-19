// La configuration est une fonction afin de distinguer le serveur de
// developpement de la construction : `define` s'applique aux deux modes, et
// forcer NODE_ENV=production en developpement priverait le developpeur des
// avertissements de React.
//
// Pourquoi ce reglage existe (recommandation R3 de docs/12-Axes-amelioration.md) :
// hors de Vercel, NODE_ENV n'est pas defini, si bien que la construction locale
// et celle de l'integration continue embarquaient le build de DEVELOPPEMENT de
// React (329 570 octets, avec jsxDEV et validateDOMNesting) alors que la
// production en recoit 153 784. L'artefact verifie n'etait donc pas l'artefact
// livre. Ce reglage rend les deux identiques.
module.exports = ({ command }) => ({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },

  ...(command === 'build'
    ? {
        define: {
          'process.env.NODE_ENV': JSON.stringify('production'),
        },
        esbuild: {
          jsxDev: false,
        },
      }
    : {}),
});
