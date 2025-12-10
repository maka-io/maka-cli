/**
 * maka-cli - Wrapper for @maka/maka-cli with special character path fixes
 *
 * This module re-exports @maka/maka-cli after the postinstall script has
 * patched it to properly handle paths containing special characters like '&'.
 *
 * See README.md for more information about the fix.
 */

// Re-export everything from @maka/maka-cli
module.exports = require('@maka/maka-cli');
