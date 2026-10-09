// utils/time.js
// Injectable clock abstraction for deterministic testing

let mockTime = null;

const timeService = {
  /**
   * Get the current date/time.
   * Uses mocked time if set, otherwise system time.
   */
  now: () => {
    if (mockTime) {
      return new Date(mockTime.getTime());
    }
    return new Date();
  },

  /**
   * Set a fixed time for testing.
   */
  setMockTime: (date) => {
    mockTime = new Date(date.getTime());
  },

  /**
   * Clear the fixed time (resume normal system time).
   */
  clearMockTime: () => {
    mockTime = null;
  }
};

module.exports = timeService;
