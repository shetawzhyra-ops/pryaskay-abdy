const path = require('path');

function registerAudioStudioRoutes(app, { authMiddleware, isHemnOrAzadUser, publicDir }) {
  // Manager-only Electronic Audio Studio page (Hemn & Mamosta Azad)
  app.get('/audio-studio', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    res.sendFile(path.join(publicDir, 'audio-studio.html'));
  });

  // Verify manager authorization cleanly
  app.get('/api/audio-studio/access', authMiddleware, (req, res) => {
    if (!isHemnOrAzadUser(req.user)) {
      return res.status(403).json({
        success: false,
        error: 'ئەم ستۆدیۆیە تەنها تایبەتە بە بەڕێوەبەرەکان (هێمن طه و ئازادی موعەبیر)'
      });
    }
    res.json({
      success: true,
      user: {
        id: req.user.id,
        full_name: req.user.full_name,
        username: req.user.username,
        role: req.user.role
      }
    });
  });
}

module.exports = { registerAudioStudioRoutes };
