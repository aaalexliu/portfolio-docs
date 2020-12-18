// import { merge } from 'theme-ui';
import defaultTheme from 'gatsby-theme-docz/src/theme/index';
import { merge } from 'lodash/fp';

// const theme = {
//   ...defaultTheme,
//   styles: {
//     ...defaultTheme.styles,
//     root: {
//       ...defaultTheme.styles.root,
//       fontSize: 2,
//       // color: 'text',
//       // bg: 'background'
//     },
//     p: {
//       fontSize: 2
//     },
//     ul: {
//       ...defaultTheme.styles.ul,
//       listStyleType: 'disc'
//     }
//   }
// }
const theme = merge(defaultTheme,
  {
    styles: {
      root: {
        fontSize: 2
      },
      ul: {
        listStyleType: 'disc'
      }
    }
  }
);

console.log(theme.styles);


export default theme;