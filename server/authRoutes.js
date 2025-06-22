const router = require('express').Router();
const passport = require('passport');

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: 'http://localhost:3000',
    successRedirect: 'http://localhost:3000/dashboard'
  })
);

router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('http://localhost:3000');
  });
});

module.exports = router;
