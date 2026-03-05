const rules = {
  email: {
    regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    message: 'Invalid email format (example: user@gmail.com)'
  },
  username: {
    regex: /^[a-zA-Z0-9_]{3,20}$/,
    message: 'Username must be 3-20 characters, only letters, numbers and underscore'
  },
  password: {
    regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_#])[A-Za-z\d@$!%*?&_#]{8,}$/,
    message: 'Password must have: min 8 chars, uppercase, lowercase, number and special character (@$!%*?&_#)'
  }
};

export const validateRegister = (req, res, next) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required (username, email, password, role)'
    });
  }
  if (!rules.username.regex.test(username)) {
    return res.status(400).json({
      success: false,
      message: rules.username.message
    });
  }
  if (!rules.email.regex.test(email)) {
    return res.status(400).json({
      success: false,
      message: rules.email.message
    });
  }
  if (!rules.password.regex.test(password)) {
    return res.status(400).json({
      success: false,
      message: rules.password.message
    });
  }
  const allowedRoles = ['gamer', 'organizer', 'sponsor'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role. Choose: gamer, organizer, or sponsor'
    });
  }
  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
  if (!rules.email.regex.test(email)) {
    return res.status(400).json({
      success: false,
      message: rules.email.message
    });
  }
  next();
};

export const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }
  if (!rules.email.regex.test(email)) {
    return res.status(400).json({
      success: false,
      message: rules.email.message
    });
  }
  next();
};

export const validateResetPassword = (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'New password is required'
    });
  }
  if (!rules.password.regex.test(password)) {
    return res.status(400).json({
      success: false,
      message: rules.password.message
    });
  }
  next();
};

export const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required'
    });
  }
  if (!rules.password.regex.test(newPassword)) {
    return res.status(400).json({
      success: false,
      message: rules.password.message
    });
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({
      success: false,
      message: 'New password cannot be same as current password'
    });
  }
  next();
};

export const validateUpdateEmail = (req, res, next) => {
  const { newEmail, password } = req.body;

  if (!newEmail || !password) {
    return res.status(400).json({
      success: false,
      message: 'New email and password are required'
    });
  }
  if (!rules.email.regex.test(newEmail)) {
    return res.status(400).json({
      success: false,
      message: rules.email.message
    });
  }
  next();
};