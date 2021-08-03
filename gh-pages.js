var ghpages = require('gh-pages');

ghpages.publish(
    'public', // path to public directory
    {
        branch: 'gh-pages',
        repo: 'https://github.com/pthibodeau11/rubiks-cube-svelte', // Update to point to your repository  
        user: {
            name: 'Pat Thibodeau', // update to use your name
            email: 'patrick.thibodeau@gmail.com' // Update to use your email
        }
    },
    () => {
        console.log('Deploy Complete!')
    }
)