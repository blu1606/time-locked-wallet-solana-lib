/// Conditional logging based on build configuration
/// Only logs in debug builds to reduce compute cost in production
#[macro_export]
macro_rules! debug_msg {
    ($($arg:tt)*) => {
        #[cfg(feature = "debug-logs")]
        msg!($($arg)*);
    };
}

/// Always log critical events regardless of build type
#[macro_export]
macro_rules! critical_msg {
    ($($arg:tt)*) => {
        msg!($($arg)*);
    };
}

/// Log only errors and important state changes
#[macro_export]
macro_rules! event_msg {
    ($($arg:tt)*) => {
        #[cfg(any(feature = "debug-logs", feature = "event-logs"))]
        msg!($($arg)*);
    };
}
