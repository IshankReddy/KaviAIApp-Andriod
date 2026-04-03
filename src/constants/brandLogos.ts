/** Original KaviAI marks — dark / light theme variants. */
const LOGO_DARK = require('../../assets/logo-dark.png');
const LOGO_LIGHT = require('../../assets/logo-light.png');

export function themedBrandLogo(dark: boolean) {
  return dark ? LOGO_DARK : LOGO_LIGHT;
}
