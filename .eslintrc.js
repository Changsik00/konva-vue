module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:vue/essential',
    'prettier',
    'plugin:prettier/recommended',
  ],
  plugins: ['prettier'],
  rules: {'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off'},
};