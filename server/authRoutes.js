const router = require('express').Router();
const passport = require('passport');

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback',
  passport.authenticate('google', {
successRedirect: `${process.env.FRONTEND_URL}/dashboard`,
failureRedirect: `${process.env.FRONTEND_URL}/login`,
  })
);

app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect(process.env.FRONTEND_URL); // ✅ dynamic redirect
  });
});

module.exports = router;
