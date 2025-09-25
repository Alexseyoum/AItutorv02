// Common button styles
export const BUTTON_STYLES = {
  primary: "w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed",
  destructive: "w-full h-11 font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
} as const;

// Common form validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELDS: "Please fill in all fields",
  LOGIN_FAILED: "Login failed",
  REGISTRATION_FAILED: "Registration failed", 
  LOGIN_ERROR: "An error occurred during login",
  REGISTRATION_ERROR: "An error occurred during registration",
  SIGNOUT_ERROR: "An error occurred while signing out",
  LOGIN_SUCCESS: "Login successful! Redirecting to your profile...",
  REGISTRATION_SUCCESS: "Registration successful! Redirecting to your profile...",
  SIGNOUT_SUCCESS: "Signed out successfully",
  SIGNOUT_FAILED: "Failed to sign out"
} as const;

// Common redirect delays
export const REDIRECT_DELAY = 1000;