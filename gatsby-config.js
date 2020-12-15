console.log(process.env.NODE_ENV);
const NODE_ENV = process.env.NODE_ENV;

module.exports = {
  pathPrefix: NODE_ENV === 'production' ? '/portfolio' : '/',
  siteMetadata: {
    title: `How I Built Margins`,
    description: `A technical overview of how I built Margins, one place for all your marginalia`,
    author: `Alex Liu`,
  },
  plugins: [
    {
      resolve: 'gatsby-theme-docz'
    },
    // `gatsby-plugin-react-helmet`,
    // {
    //   resolve: `gatsby-source-filesystem`,
    //   options: {
    //     name: `images`,
    //     path: `${__dirname}/src/images`,
    //   },
    // },
    // `gatsby-transformer-sharp`,
    // `gatsby-plugin-sharp`,
    // {
    //   resolve: `gatsby-plugin-manifest`,
    //   options: {
    //     name: `gatsby-starter-default`,
    //     short_name: `starter`,
    //     start_url: `/`,
    //     background_color: `#663399`,
    //     theme_color: `#663399`,
    //     display: `minimal-ui`,
    //     icon: `src/images/gatsby-icon.png`, // This path is relative to the root of the site.
    //   },
    // },
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
  ]
}
