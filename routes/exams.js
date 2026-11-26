const path = require('path');

function detectAttachmentType(file) {
  const mime = String(file?.mimetype || '').toLowerCase();
  const ext = path.extname(String(file?.originalname || file?.filename || '')).toLowerCase();
  if (mime.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp'].includes(ext)) {
    return 'image';
  }
  if (mime.startsWith('video/') || ['.mp4', '.mov', '.mkv', '.m4v', '.ogv'].includes(ext)) {
    return 'video';
  }
  if (mime.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.webm', '.m4a', '.aac', '.opus', '.flac', '.oga'].includes(ext)) {
    return 'audio';
  }
  return 'file';
}

function emitToUserSockets(io, onlineUsers, userId, event, payload) {
  if (!io || !userId) return;
  const notified = new Set();
  if (onlineUsers) {
    for (const [sockId, u] of onlineUsers.entries()) {
      if (Number(u.id) === Number(userId) && !notified.has(sockId)) {
        notified.add(sockId);
        io.to(sockId).emit(event, payload);
      }
    }
  }
  if (io.sockets && io.sockets.sockets) {
    for (const [sockId, s] of io.sockets.sockets) {
      if (s.user && Number(s.user.id) === Number(userId) && !notified.has(sockId)) {
        notified.add(sockId);
        io.to(sockId).emit(event, payload);
      }
    }
  }
}

function emitToManagers(io, onlineUsers, isHemnOrAzadUser, event, payload) {
  if (!io) return;
  const notified = new Set();
  if (onlineUsers) {
    for (const [sockId, u] of onlineUsers.entries()) {
      if (isHemnOrAzadUser(u) && !notified.has(sockId)) {
        notified.add(sockId);
        io.to(sockId).emit(event, payload);
      }
    }
  }
  if (io.sockets && io.sockets.sockets) {
    for (const [sockId, s] of io.sockets.sockets) {
      if (s.user && isHemnOrAzadUser(s.user) && !notified.has(sockId)) {
        notified.add(sockId);
        io.to(sockId).emit(event, payload);
      }
    }
  }
}

function registerExamRoutes(app, {
  examsDb,
  privateMessages,
  authMiddleware,
  isHemnOrAzadUser,
  upload,
  optimizeSingleFile,
  io,
  onlineUsers,
  publicDir
}) {
  // Guard: Strictly Hemn & Mamosta Azad (Super Admin Managers)
  function requireExamManager(req, res, next) {
    if (!isHemnOrAzadUser(req.user)) {
      return res.status(403).json({ success: false, error: 'تەنها بەڕێوەبەرەکان دەسەڵاتی بەڕێوەبردنی ئیمتیحانیان هەیە' });
    }
    next();
  }

  // Dedicated Electronic Exam Page Route
  app.get('/exams', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    res.sendFile(path.join(publicDir, 'exams.html'));
  });

  // 1. Summary Badge Counts (for Main App Profile & Drawer)
  app.get('/api/exams/summary', authMiddleware, (req, res) => {
    try {
      const isManager = isHemnOrAzadUser(req.user);
      if (isManager) {
        const stats = examsDb.getManagerSummary();
        return res.json({ success: true, isManager: true, ...stats });
      }
      const stats = examsDb.getStudentSummary(req.user.id);
      return res.json({ success: true, isManager: false, ...stats });
    } catch (err) {
      console.error('Exam summary error:', err);
      res.status(500).json({ success: false, error: 'هەڵە لە وەرگرتنی ئاماری ئیمتیحانەکان' });
    }
  });

  // 2. Upload Rich Media for Any Exam Question (Image / Video / Audio / File)
  app.post('/api/exams/upload-media', authMiddleware, requireExamManager, (req, res) => {
    upload.single('media')(req, res, async (err) => {
      if (err) {
        return res.status(err.statusCode || 400).json({
          success: false,
          error: err.message || 'هەڵە لە بارکردنی فایل'
        });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'تکایە فایلێک هەڵبژێرە' });
      }
      try {
        const mediaType = detectAttachmentType(req.file);
        if (mediaType === 'image' && typeof optimizeSingleFile === 'function') {
          await optimizeSingleFile(req.file);
        }
        const safeOrigName = Buffer.from(req.file.originalname || req.file.filename, 'latin1').toString('utf8');
        const cleanName = /[\uFFFD]/.test(safeOrigName) ? (req.file.originalname || req.file.filename) : safeOrigName;
        res.json({
          success: true,
          attachment: {
            url: `/uploads/${req.file.filename}`,
            type: mediaType,
            name: String(cleanName || req.file.filename).slice(0, 180),
            size: Number(req.file.size || 0)
          }
        });
      } catch (e) {
        console.error('Exam media upload error:', e);
        res.status(500).json({ success: false, error: 'هەڵە لە پاشەکەوتکردنی فایل' });
      }
    });
  });

  // =========================================================================
  // MANAGER ROUTES (Create, Edit, Manage, Grade, Finalize)
  // =========================================================================

  app.get('/api/exams/admin/list', authMiddleware, requireExamManager, (req, res) => {
    try {
      const exams = examsDb.listAdminExams();
      res.json({ success: true, exams });
    } catch (err) {
      console.error('List admin exams error:', err);
      res.status(500).json({ success: false, error: 'هەڵە لە هێنانی لیستی ئیمتیحانەکان' });
    }
  });

  app.get('/api/exams/admin/:id', authMiddleware, requireExamManager, (req, res) => {
    try {
      const examId = parseInt(req.params.id, 10);
      const exam = examsDb.getExamWithQuestions(examId);
      if (!exam) return res.status(404).json({ success: false, error: 'ئیمتیحانەکە نەدۆزرایەوە' });
      res.json({ success: true, exam });
    } catch (err) {
      res.status(500).json({ success: false, error: 'هەڵە لە هێنانی ئیمتیحان' });
    }
  });

  app.post('/api/exams/admin', authMiddleware, requireExamManager, (req, res) => {
    try {
      const { title, description, subject, status, questions } = req.body || {};
      if (!title || !String(title).trim()) {
        return res.status(400).json({ success: false, error: 'تکایە ناونیشانی ئیمتیحانەکە بنووسە' });
      }
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ success: false, error: 'تکایە لانی کەم پرسیارێک زیاد بکە' });
      }
      if (questions.length > 500) {
        return res.status(400).json({ success: false, error: 'زۆرترین ژمارەی پرسیار لە یەک ئیمتیحاندا ٥٠٠ پرسیارە' });
      }
      const hasValidQuestion = questions.some(q =>
        String(q?.question_text || q?.text || '').trim().length > 0 ||
        (Array.isArray(q?.attachments) && q.attachments.length > 0)
      );
      if (!hasValidQuestion) {
        return res.status(400).json({ success: false, error: 'تکایە دەق یان فایل بۆ پرسیارەکان دابنێ' });
      }

      const exam = examsDb.createExam({
        title,
        description,
        subject,
        creator_id: req.user.id,
        creator_name: req.user.full_name || req.user.username,
        status: status || 'published',
        questions
      });

      if (exam.status === 'published' && io) {
        io.emit('exam_published', {
          examId: exam.id,
          title: exam.title,
          questionCount: exam.questions.length,
          totalMaxScore: exam.total_max_score,
          creatorName: exam.creator_name
        });
      }

      res.json({ success: true, exam });
    } catch (err) {
      console.error('Create exam error:', err);
      res.status(500).json({ success: false, error: 'هەڵە لە دروستکردنی ئیمتیحان' });
    }
  });

  app.put('/api/exams/admin/:id', authMiddleware, requireExamManager, (req, res) => {
    try {
      const examId = parseInt(req.params.id, 10);
      const before = examsDb.getExamById(examId);
      if (!before) return res.status(404).json({ success: false, error: 'ئیمتیحانەکە نەدۆزرایەوە' });

      const { title, description, subject, status, questions } = req.body || {};
      if (!title || !String(title).trim()) {
        return res.status(400).json({ success: false, error: 'تکایە ناونیشانی ئیمتیحانەکە بنووسە' });
      }
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ success: false, error: 'تکایە لانی کەم پرسیارێک هەبێت' });
      }

      const exam = examsDb.updateExam(examId, { title, description, subject, status, questions });
      if (before.status !== 'published' && exam.status === 'published' && io) {
        io.emit('exam_published', {
          examId: exam.id,
          title: exam.title,
          questionCount: exam.questions.length,
          totalMaxScore: exam.total_max_score,
          creatorName: exam.creator_name
        });
      }
      res.json({ success: true, exam });
    } catch (err) {
      console.error('Update exam error:', err);
      res.status(500).json({ success: false, error: 'هەڵە لە نوێکردنەوەی ئیمتیحان' });
    }
  });

  app.patch('/api/exams/admin/:id/status', authMiddleware, requireExamManager, (req, res) => {
    try {
      const examId = parseInt(req.params.id, 10);
      const { status } = req.body || {};
      const before = examsDb.getExamById(examId);
      if (!before) return res.status(404).json({ success: false, error: 'ئیمتیحانەکە نەدۆزرایەوە' });
      const updated = examsDb.updateExamStatus(examId, status);
      if (!updated) return res.status(400).json({ success: false, error: 'دۆخی نادروستە' });

      if (before.status !== 'published' && updated.status === 'published' && io) {
        io.emit('exam_published', {
          examId: updated.id,
          title: updated.title,
          creatorName: updated.creator_name
        });
      }
      res.json({ success: true, exam: updated });
    } catch (err) {
      res.status(500).json({ success: false, error: 'هەڵە لە گۆڕینی دۆخی ئیمتیحان' });
    }
  });

  app.delete('/api/exams/admin/:id', authMiddleware, requireExamManager, (req, res) => {
    try {
      const examId = parseInt(req.params.id, 10);
      const ok = examsDb.deleteExam(examId);
      if (!ok) return res.status(404).json({ success: false, error: 'ئیمتیحانەکە نەدۆزرایەوە' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'هەڵە لە سڕینەوەی ئیمتیحان' });
    }
  });

  // Submissions List for an Exam
  app.get('/api/exams/admin/:id/submissions', authMiddleware, requireExamManager, (req, res) => {
    try {
      const examId = parseInt(req.params.id, 10);
      const exam = examsDb.getExamWithQuestions(examId);
      if (!exam) return res.status(404).json({ success: false, error: 'ئیمتیحانەکە نەدۆزرایەوە' });
      const submissions = examsDb.listSubmissionsForExam(examId);
      res.json({ success: true, exam, submissions });
    } catch (err) {
      console.error('List exam submissions error:', err);
      res.status(500).json({ success: false, error: 'هەڵە لە هێنانی وەڵامی قوتابیان' });
    }
  });

  // Full Grading Sheet for One Student Submission
  app.get('/api/exams/admin/submissions/:submissionId', authMiddleware, requireExamManager, (req, res) => {
    try {
      const subId = parseInt(req.params.submissionId, 10);
      const submission = examsDb.getSubmissionById(subId);
      if (!submission) return res.status(404).json({ success: false, error: 'پەڕەی ئیمتیحان نەدۆزرایەوە' });
      const exam = examsDb.getExamWithQuestions(submission.exam_id);
      if (!exam) return res.status(404).json({ success: false, error: 'ئیمتیحانەکە نەدۆزرایەوە' });
      const answers = examsDb.getSubmissionAnswers(subId);
      const totals = examsDb.computeSubmissionTotals(subId, submission.exam_id);
      res.json({ success: true, exam, submission, answers, totals });
    } catch (err) {
      console.error('Get submission grading sheet error:', err);
      res.status(500).json({ success: false, error: 'هەڵە لە هێنانی پەڕەی هەڵسەنگاندن' });
    }
  });

  // Auto-save Single Question Mark (✅/❌ + Score + Note)
  app.put('/api/exams/admin/submissions/:submissionId/grade-answer', authMiddleware, requireExamManager, (req, res) => {
    try {
      const subId = parseInt(req.params.submissionId, 10);
      const { question_id, is_correct, score, teacher_note } = req.body || {};
      const qId = parseInt(question_id, 10);
      if (!qId) return res.status(400).json({ success: false, error: 'ناسنامەی پرسیار هەڵەیە' });
      const result = examsDb.gradeSingleAnswer(subId, qId, { is_correct, score, teacher_note });
      if (!result) return res.status(404).json({ success: false, error: 'پرسیار یان پەڕە نەدۆزرایەوە' });
      res.json({ success: true, ...result });
    } catch (err) {
      console.error('Grade answer error:', err);
      res.status(500).json({ success: false, error: 'هەڵە لە پاشەکەوتکردنی نمرە' });
    }
  });

  // Finalize Grading: Auto-Sum All Scores & Return Result to Student!
  app.post('/api/exams/admin/submissions/:submissionId/finalize', authMiddleware, requireExamManager, (req, res) => {
    try {
      const subId = parseInt(req.params.submissionId, 10);
      const { grades, teacher_feedback } = req.body || {};
      const finalized = examsDb.finalizeSubmission(subId, req.user, { grades, teacher_feedback });
      if (!finalized) return res.status(404).json({ success: false, error: 'پەڕەی ئیمتیحان نەدۆزرایەوە' });

      const exam = examsDb.getExamById(finalized.exam_id);
      const examTitle = exam ? exam.title : 'ئیمتیحان';

      // Notify student in real-time via Socket.IO
      emitToUserSockets(io, onlineUsers, finalized.student_id, 'exam_graded', {
        submissionId: finalized.id,
        examId: finalized.exam_id,
        examTitle,
        totalScore: finalized.total_score,
        maxTotalScore: finalized.max_total_score,
        correctCount: finalized.correct_count,
        wrongCount: finalized.wrong_count,
        gradedBy: finalized.graded_by_name
      });

      // Also notify managers to refresh ungraded badge counts
      emitToManagers(io, onlineUsers, isHemnOrAzadUser, 'exam_summary_updated', {
        examId: finalized.exam_id,
        submissionId: finalized.id
      });

      // Send a neat result notification to the student's private chat as well
      if (privateMessages && finalized.student_id && Number(finalized.student_id) !== Number(req.user.id)) {
        try {
          const pct = finalized.max_total_score > 0
            ? Math.round((finalized.total_score / finalized.max_total_score) * 100)
            : 0;
          const pmBody =
            `🏆 ئەنجامی ئیمتیحانی «${examTitle}» دەرچوو!\n\n` +
            `📊 نمرەی کۆتایی: ${finalized.total_score} لە ${finalized.max_total_score} (${pct}%)\n` +
            `✅ وەڵامی ڕاست: ${finalized.correct_count} | ❌ وەڵامی هەڵە: ${finalized.wrong_count}\n` +
            (finalized.teacher_feedback ? `📝 تێبینی مامۆستا: ${finalized.teacher_feedback}\n` : '') +
            `\nدەتوانیت لە بەشی «ئیمتیحانەکان» تەواوی پەڕەی ئیمتیحانەکەت و نمرەکان ببینیت.`;
          const pmMsg = privateMessages.create(
            req.user.id,
            finalized.student_id,
            req.user.full_name || req.user.username,
            req.user.role || 'super_admin',
            pmBody,
            'text'
          );
          emitToUserSockets(io, onlineUsers, finalized.student_id, 'new_private_message', pmMsg);
        } catch (pmErr) {
          console.error('Failed to send exam result PM:', pmErr);
        }
      }

      res.json({ success: true, submission: finalized });
    } catch (err) {
      console.error('Finalize exam grading error:', err);
      res.status(500).json({ success: false, error: 'هەڵە لە کۆتاییهێنان بە ئەنجامی ئیمتیحان' });
    }
  });

  // =========================================================================
  // STUDENT ROUTES (Browse Active Exams, Lock Answers Permanently, Submit, View Result)
  // =========================================================================

  app.get('/api/exams/student/list', authMiddleware, (req, res) => {
    try {
      const exams = examsDb.listStudentExams(req.user.id);
      res.json({ success: true, exams });
    } catch (err) {
      console.error('List student exams error:', err);
      res.status(500).json({ success: false, error: 'هەڵە لە هێنانی لیستی ئیمتیحانەکان' });
    }
  });

  app.get('/api/exams/student/:id', authMiddleware, (req, res) => {
    try {
      const examId = parseInt(req.params.id, 10);
      const exam = examsDb.getExamWithQuestions(examId);
      if (!exam || exam.status === 'draft') {
        return res.status(404).json({ success: false, error: 'ئەم ئیمتیحانە بەردەست نییە' });
      }

      const submission = examsDb.getOrCreateSubmission(examId, req.user, exam.status === 'published');
      if (!submission && exam.status === 'closed') {
        return res.status(403).json({ success: false, error: 'ئەم ئیمتیحانە داخراوە و کاتی وەڵامدانەوەی تەواوبووە' });
      }

      const rawAnswers = submission ? examsDb.getSubmissionAnswers(submission.id) : [];
      const isGraded = submission && submission.status === 'graded';

      // Hide grading marks/notes AND objective answer keys until teacher finalizes the result
      exam.questions = (exam.questions || []).map(q => ({
        ...q,
        correct_answer: isGraded ? (q.correct_answer || '') : ''
      }));

      const answers = rawAnswers.map(a => ({
        id: a.id,
        question_id: a.question_id,
        answer_text: a.answer_text,
        is_locked: Number(a.is_locked) === 1,
        locked_at: a.locked_at,
        is_correct: isGraded ? a.is_correct : null,
        score: isGraded ? a.score : null,
        teacher_note: isGraded ? (a.teacher_note || '') : ''
      }));

      res.json({ success: true, exam, submission, answers });
    } catch (err) {
      console.error('Get student exam error:', err);
      res.status(500).json({ success: false, error: 'هەڵە لە کردنەوەی پەڕەی ئیمتیحان' });
    }
  });

  // Permanently Lock One Answer (Cannot be erased or altered once locked!)
  app.post('/api/exams/student/:id/lock-answer', authMiddleware, (req, res) => {
    try {
      const examId = parseInt(req.params.id, 10);
      const exam = examsDb.getExamById(examId);
      if (!exam || exam.status !== 'published') {
        return res.status(403).json({ success: false, error: 'ئەم ئیمتیحانە لە ئێستادا داخراوە' });
      }
      const submission = examsDb.getOrCreateSubmission(examId, req.user);
      if (!submission || submission.status !== 'in_progress') {
        return res.status(403).json({ success: false, error: 'ئەم ئیمتیحانە پێشتر نێردراوە و ناتوانیت دەستکاری بکەیت' });
      }

      const questionId = parseInt(req.body?.question_id, 10);
      const answerText = req.body?.answer_text;
      if (!questionId) {
        return res.status(400).json({ success: false, error: 'پرسیارەکە دیاری نەکراوە' });
      }

      const result = examsDb.lockStudentAnswer(submission.id, examId, questionId, answerText);
      if (result.error) {
        return res.status(result.locked ? 403 : 400).json({ success: false, ...result });
      }

      res.json({ success: true, answer: result.answer, lockedCount: result.lockedCount });
    } catch (err) {
      console.error('Lock student answer error:', err);
      res.status(500).json({ success: false, error: 'هەڵە لە جێگیرکردنی وەڵام' });
    }
  });

  // Final Submit Exam Paper to Manager
  app.post('/api/exams/student/:id/submit', authMiddleware, (req, res) => {
    try {
      const examId = parseInt(req.params.id, 10);
      const exam = examsDb.getExamById(examId);
      if (!exam || exam.status !== 'published') {
        return res.status(403).json({ success: false, error: 'ئەم ئیمتیحانە لە ئێستادا داخراوە' });
      }
      const submission = examsDb.getOrCreateSubmission(examId, req.user);
      if (!submission || submission.status !== 'in_progress') {
        return res.status(400).json({ success: false, error: 'ئەم ئیمتیحانە پێشتر نێردراوە' });
      }

      const pendingAnswers = Array.isArray(req.body?.pendingAnswers) ? req.body.pendingAnswers : [];
      const result = examsDb.submitStudentExam(submission.id, examId, pendingAnswers);
      if (result.error) {
        return res.status(400).json({ success: false, error: result.error });
      }

      // Notify managers in real time!
      emitToManagers(io, onlineUsers, isHemnOrAzadUser, 'exam_submitted', {
        examId,
        examTitle: exam.title,
        submissionId: result.submission.id,
        studentName: result.submission.student_name
      });

      res.json({ success: true, submission: result.submission });
    } catch (err) {
      console.error('Submit student exam error:', err);
      res.status(500).json({ success: false, error: 'هەڵە لە ناردنی ئیمتیحان' });
    }
  });
}

module.exports = { registerExamRoutes };
