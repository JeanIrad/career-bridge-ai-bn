import { UserRole } from '@prisma/client';

export const handlebarsHelpers = {
  // Helper to compare two values for equality
  eq: function (a: any, b: any) {
    return a === b;
  },

  // Helper to compare if value is not equal
  neq: function (a: any, b: any) {
    return a !== b;
  },

  // Helper to format dates nicely
  formatDate: function (date: Date | string) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // Helper to capitalize first letter
  capitalize: function (str: string) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  // Helper to get role display name
  getRoleDisplayName: function (role: UserRole) {
    const roleNames = {
      [UserRole.STUDENT]: 'Student',
      [UserRole.ALUMNI]: 'Alumni',
      [UserRole.EMPLOYER]: 'Employer',
      [UserRole.PROFESSOR]: 'Professor',
      [UserRole.MENTOR]: 'Mentor',
      [UserRole.UNIVERSITY_STAFF]: 'University Staff',
      [UserRole.ADMIN]: 'Administrator',
      [UserRole.SUPER_ADMIN]: 'Super Administrator',
      [UserRole.OTHER]: 'Member',
    };
    return roleNames[role] || 'Member';
  },

  // Helper to get role-specific features
  getRoleFeatures: function (role: UserRole) {
    const features = {
      [UserRole.STUDENT]: [
        'Browse job opportunities and internships',
        'Apply for positions with one click',
        'Connect with alumni and mentors',
        'Join student forums and events',
        'Build your professional profile',
        'Access career resources and tips',
      ],
      [UserRole.ALUMNI]: [
        'Mentor current students',
        'Share job opportunities',
        'Create networking events',
        'Access exclusive alumni resources',
        'Connect with fellow alumni',
        'Give back to your community',
      ],
      [UserRole.EMPLOYER]: [
        'Post job opportunities',
        'Search and recruit candidates',
        'Create detailed company profiles',
        'Host virtual recruitment events',
        'Access our talent pipeline',
        'Build your employer brand',
      ],
      [UserRole.PROFESSOR]: [
        'Manage student profiles',
        'Create academic events',
        'Mentor students effectively',
        'Access academic resources',
        'Collaborate with colleagues',
        'Track student progress',
      ],
      [UserRole.MENTOR]: [
        'Create mentorship programs',
        'Host workshops and events',
        'Guide career development',
        'Share industry insights',
        'Build meaningful relationships',
        'Make a lasting impact',
      ],
      [UserRole.UNIVERSITY_STAFF]: [
        'Manage university profiles',
        'Verify student accounts',
        'Coordinate career services',
        'Access analytics and reports',
        'Manage institutional events',
        'Support student success',
      ],
    };
    return (
      features[role] || ['Access platform features', 'Connect with others']
    );
  },

  // Helper to truncate text
  truncate: function (str: string, length: number) {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
  },

  // Helper for conditional logic
  if_eq: function (a: any, b: any, opts: any) {
    if (a === b) {
      return opts.fn(this);
    } else {
      return opts.inverse(this);
    }
  },

  // Helper to check if value exists in array
  in: function (value: any, array: any[], opts: any) {
    if (array && array.includes(value)) {
      return opts.fn(this);
    } else {
      return opts.inverse(this);
    }
  },

  // Helper to add numbers
  add: function (a: number, b: number) {
    return a + b;
  },

  // Helper to multiply numbers
  multiply: function (a: number, b: number) {
    return a * b;
  },

  // Helper to format time ago
  timeAgo: function (date: Date | string) {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  },

  // Helper to get ordinal numbers (1st, 2nd, 3rd, etc.)
  ordinal: function (num: number) {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  },

  // Helper for JSON stringify (useful for debugging)
  json: function (obj: any) {
    return JSON.stringify(obj, null, 2);
  },

  // Helper to get current year
  currentYear: function () {
    return new Date().getFullYear();
  },

  // Helper to check if string contains substring
  contains: function (str: string, substring: string) {
    if (!str || !substring) return false;
    return str.toLowerCase().includes(substring.toLowerCase());
  },

  // Helper for switch-case logic
  switch: function (value: any, options: any) {
    this.switch_value = value;
    this.switch_break = false;
    return options.fn(this);
  },

  case: function (value: any, options: any) {
    if (value === this.switch_value && !this.switch_break) {
      this.switch_break = true;
      return options.fn(this);
    }
  },

  default: function (options: any) {
    if (!this.switch_break) {
      return options.fn(this);
    }
  },
};

// Default export for module compatibility
export default handlebarsHelpers;
