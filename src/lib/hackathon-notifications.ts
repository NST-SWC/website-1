/**
 * Hackathon Notification System
 * Centralized configuration and utilities for DevForge hackathon notifications
 */

import { addHours, addMinutes, subHours, subMinutes } from 'date-fns';

// Hackathon event date and time (IST)
export const HACKATHON_DATE = new Date('2025-12-20T07:00:00+05:30'); // Dec 20, 2025, 7:00 AM IST

/**
 * Notification templates for different hackathon milestones
 */
export const NOTIFICATION_TEMPLATES = {
    REGISTRATION_CONFIRMATION: {
        title: "Welcome to DevForge! 🚀",
        body: "Registration received! Check your email for next steps and important details.",
        icon: "/app-icon-192.png",
        badge: "/app-icon-72.png",
        tag: "hackathon-registration",
        data: {
            url: "/hackathon",
            type: "registration"
        },
        vibrate: [200, 100, 200]
    },

    DAY_BEFORE_REMINDER: {
        title: "DevForge Tomorrow! ⚡",
        body: "Get ready! Event starts at 7:00 AM IST. Bring your laptop, charger, and creativity!",
        icon: "/app-icon-192.png",
        badge: "/app-icon-72.png",
        tag: "hackathon-reminder",
        data: {
            url: "/hackathon",
            type: "reminder"
        },
        vibrate: [200, 100, 200, 100, 200]
    },

    CHECK_IN_REMINDER: {
        title: "Check-In Opens in 30 Minutes! 🎯",
        body: "Check-in starts at 7:00 AM. Head to NST Campus now!",
        icon: "/app-icon-192.png",
        badge: "/app-icon-72.png",
        tag: "hackathon-checkin",
        requireInteraction: true,
        data: {
            url: "/hackathon",
            type: "checkin"
        },
        vibrate: [300, 100, 300]
    },

    OPENING_CEREMONY: {
        title: "Opening Ceremony Starting Soon! 🎉",
        body: "Join us in 15 minutes for the kickoff at 8:00 AM!",
        icon: "/app-icon-192.png",
        badge: "/app-icon-72.png",
        tag: "hackathon-opening",
        data: {
            url: "/hackathon",
            type: "ceremony"
        },
        vibrate: [200, 100, 200]
    },

    CODING_BEGINS: {
        title: "Coding Starts in 5 Minutes! 💻",
        body: "Time to build something amazing! Let the hacking begin at 9:00 AM!",
        icon: "/app-icon-192.png",
        badge: "/app-icon-72.png",
        tag: "hackathon-coding",
        data: {
            url: "/hackathon",
            type: "coding"
        },
        vibrate: [200, 100, 200, 100, 200]
    },

    LUNCH_BREAK: {
        title: "Lunch Break in 15 Minutes! 🍕",
        body: "Take a break at 1:00 PM, refuel, and network with fellow hackers!",
        icon: "/app-icon-192.png",
        badge: "/app-icon-72.png",
        tag: "hackathon-lunch",
        data: {
            url: "/hackathon",
            type: "break"
        },
        vibrate: [200, 100, 200]
    },

    MID_EVALUATION: {
        title: "Mid-Evaluation Starting Soon! 📊",
        body: "Mentors are ready to help at 2:00 PM. Check in and get feedback!",
        icon: "/app-icon-192.png",
        badge: "/app-icon-72.png",
        tag: "hackathon-evaluation",
        data: {
            url: "/hackathon",
            type: "evaluation"
        },
        vibrate: [200, 100, 200]
    },

    FINAL_SUBMISSION_WARNING: {
        title: "1 Hour Until Submission Deadline! ⏰",
        body: "Final submissions due at 6:00 PM. Upload to Devpost now!",
        icon: "/app-icon-192.png",
        badge: "/app-icon-72.png",
        tag: "hackathon-submission-warning",
        requireInteraction: true,
        data: {
            url: "/hackathon",
            type: "submission"
        },
        vibrate: [300, 100, 300, 100, 300]
    },

    FINAL_SUBMISSION_REMINDER: {
        title: "15 Minutes to Submit! 🚨",
        body: "Last chance! Submit your project to Devpost before 6:00 PM!",
        icon: "/app-icon-192.png",
        badge: "/app-icon-72.png",
        tag: "hackathon-submission-final",
        requireInteraction: true,
        data: {
            url: "/hackathon",
            type: "submission"
        },
        vibrate: [400, 100, 400, 100, 400]
    },

    DEMOS_JUDGING: {
        title: "Demo Time! 🎬",
        body: "Demos and judging start at 6:30 PM. Get ready to present your solution!",
        icon: "/app-icon-192.png",
        badge: "/app-icon-72.png",
        tag: "hackathon-demos",
        data: {
            url: "/hackathon",
            type: "demos"
        },
        vibrate: [200, 100, 200]
    },

    CLOSING_CEREMONY: {
        title: "Closing Ceremony in 10 Minutes! 🏆",
        body: "Winners will be announced at 7:00 PM. Don't miss it!",
        icon: "/app-icon-192.png",
        badge: "/app-icon-72.png",
        tag: "hackathon-closing",
        requireInteraction: true,
        data: {
            url: "/hackathon",
            type: "ceremony"
        },
        vibrate: [300, 100, 300, 100, 300]
    }
};

/**
 * Calculate notification schedule based on hackathon date
 * Returns array of { sendAt: Date, payload: object, meta: object }
 */
export function calculateNotificationSchedule(hackathonDate: Date = HACKATHON_DATE) {
    return [
        // Day before reminder (Dec 19, 6:00 PM IST)
        {
            sendAt: subHours(hackathonDate, 13), // 13 hours before = 6 PM previous day
            payload: NOTIFICATION_TEMPLATES.DAY_BEFORE_REMINDER,
            meta: {
                type: 'day-before-reminder',
                description: 'Reminder sent 1 day before event'
            }
        },

        // Check-in reminder (Dec 20, 6:30 AM IST)
        {
            sendAt: subMinutes(hackathonDate, 30),
            payload: NOTIFICATION_TEMPLATES.CHECK_IN_REMINDER,
            meta: {
                type: 'checkin-reminder',
                description: '30 minutes before check-in'
            }
        },

        // Opening ceremony (Dec 20, 7:45 AM IST)
        {
            sendAt: addMinutes(hackathonDate, 45),
            payload: NOTIFICATION_TEMPLATES.OPENING_CEREMONY,
            meta: {
                type: 'opening-ceremony',
                description: '15 minutes before opening ceremony at 8:00 AM'
            }
        },

        // Coding begins (Dec 20, 8:55 AM IST)
        {
            sendAt: addHours(addMinutes(hackathonDate, 55), 1),
            payload: NOTIFICATION_TEMPLATES.CODING_BEGINS,
            meta: {
                type: 'coding-begins',
                description: '5 minutes before coding starts at 9:00 AM'
            }
        },

        // Lunch break (Dec 20, 12:45 PM IST)
        {
            sendAt: addHours(addMinutes(hackathonDate, 45), 5),
            payload: NOTIFICATION_TEMPLATES.LUNCH_BREAK,
            meta: {
                type: 'lunch-break',
                description: '15 minutes before lunch at 1:00 PM'
            }
        },

        // Mid-evaluation (Dec 20, 1:45 PM IST)
        {
            sendAt: addHours(addMinutes(hackathonDate, 45), 6),
            payload: NOTIFICATION_TEMPLATES.MID_EVALUATION,
            meta: {
                type: 'mid-evaluation',
                description: '15 minutes before mid-evaluation at 2:00 PM'
            }
        },

        // Final submission warning (Dec 20, 5:00 PM IST)
        {
            sendAt: addHours(hackathonDate, 10),
            payload: NOTIFICATION_TEMPLATES.FINAL_SUBMISSION_WARNING,
            meta: {
                type: 'submission-warning',
                description: '1 hour before final submission at 6:00 PM'
            }
        },

        // Final submission reminder (Dec 20, 5:45 PM IST)
        {
            sendAt: addHours(addMinutes(hackathonDate, 45), 10),
            payload: NOTIFICATION_TEMPLATES.FINAL_SUBMISSION_REMINDER,
            meta: {
                type: 'submission-final',
                description: '15 minutes before final submission at 6:00 PM'
            }
        },

        // Demos & judging (Dec 20, 6:15 PM IST)
        {
            sendAt: addHours(addMinutes(hackathonDate, 15), 11),
            payload: NOTIFICATION_TEMPLATES.DEMOS_JUDGING,
            meta: {
                type: 'demos-judging',
                description: '15 minutes before demos at 6:30 PM'
            }
        },

        // Closing ceremony (Dec 20, 6:50 PM IST)
        {
            sendAt: addHours(addMinutes(hackathonDate, 50), 11),
            payload: NOTIFICATION_TEMPLATES.CLOSING_CEREMONY,
            meta: {
                type: 'closing-ceremony',
                description: '10 minutes before closing ceremony at 7:00 PM'
            }
        }
    ];
}

/**
 * Get registration confirmation notification payload
 */
export function getRegistrationNotification(userName?: string) {
    const template = NOTIFICATION_TEMPLATES.REGISTRATION_CONFIRMATION;
    return {
        ...template,
        body: userName
            ? `Welcome ${userName}! Registration received. Check your email for next steps.`
            : template.body
    };
}
