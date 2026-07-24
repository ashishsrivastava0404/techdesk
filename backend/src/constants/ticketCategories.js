/**
 * Ticket Category Hierarchy
 * 
 * Single source of truth for all ticket categories, subcategories, and topics.
 * This structure is used for:
 * - Validating ticket creation requests
 * - Building the frontend category selection UI
 * - Generating reports and analytics
 */

export const TICKET_CATEGORIES = {
  // =============================================================================
  // HARDWARE ISSUES
  // =============================================================================
  hardware: {
    id: 'hardware',
    name: 'Hardware',
    icon: '💻',
    description: 'Physical equipment and device problems',
    subcategories: {
      desktop: {
        id: 'desktop',
        name: 'Desktop',
        topics: {
          display: { id: 'display', name: 'Display/Monitor Issues' },
          keyboard: { id: 'keyboard', name: 'Keyboard Problems' },
          mouse: { id: 'mouse', name: 'Mouse Issues' },
          tower: { id: 'tower', name: 'Tower/Unit Problems' },
          power: { id: 'power', name: 'Power Supply Issues' },
          networking: { id: 'networking', name: 'Network Connection' }
        }
      },
      laptop: {
        id: 'laptop',
        name: 'Laptop',
        topics: {
          screen: { id: 'screen', name: 'Screen Display Issues' },
          keyboard: { id: 'keyboard', name: 'Keyboard Problems' },
          trackpad: { id: 'trackpad', name: 'Trackpad Not Working' },
          battery: { id: 'battery', name: 'Battery/Charging Issues' },
          overheating: { id: 'overheating', name: 'Overheating Problems' },
          hinge: { id: 'hinge', name: 'Hinge/Physical Damage' }
        }
      },
      printer: {
        id: 'printer',
        name: 'Printer/Scanner',
        topics: {
          paper_jam: { id: 'paper_jam', name: 'Paper Jam' },
          print_quality: { id: 'print_quality', name: 'Print Quality Issues' },
          connection: { id: 'connection', name: 'Connection Problems' },
          scanner: { id: 'scanner', name: 'Scanner Not Working' },
          ink: { id: 'ink', name: 'Ink/Toner Replacement' }
        }
      },
      network: {
        id: 'network',
        name: 'Network Equipment',
        topics: {
          router: { id: 'router', name: 'Router Issues' },
          switch: { id: 'switch', name: 'Network Switch Problems' },
          access_point: { id: 'access_point', name: 'WiFi Access Point' },
          vpn: { id: 'vpn', name: 'VPN Connection Issues' }
        }
      },
      peripherals: {
        id: 'peripherals',
        name: 'Peripherals',
        topics: {
          webcam: { id: 'webcam', name: 'Webcam Issues' },
          headset: { id: 'headset', name: 'Headset/Microphone' },
          docking_station: { id: 'docking_station', name: 'Docking Station' },
          usb: { id: 'usb', name: 'USB Hub/Ports' }
        }
      }
    }
  },

  // =============================================================================
  // SOFTWARE ISSUES
  // =============================================================================
  software: {
    id: 'software',
    name: 'Software',
    icon: '📀',
    description: 'Applications, programs, and system software problems',
    subcategories: {
      operating_system: {
        id: 'operating_system',
        name: 'Operating System',
        topics: {
          windows: { id: 'windows', name: 'Windows Issues' },
          macos: { id: 'macos', name: 'macOS Issues' },
          linux: { id: 'linux', name: 'Linux Issues' },
          updates: { id: 'updates', name: 'System Updates' },
          boot: { id: 'boot', name: 'Boot/Startup Problems' },
          driver: { id: 'driver', name: 'Driver Issues' }
        }
      },
      productivity: {
        id: 'productivity',
        name: 'Productivity Software',
        topics: {
          office: { id: 'office', name: 'Microsoft Office Suite' },
          google_workspace: { id: 'google_workspace', name: 'Google Workspace' },
          email: { id: 'email', name: 'Email Client Issues' },
          calendar: { id: 'calendar', name: 'Calendar Sync Issues' },
          document: { id: 'document', name: 'Document Collaboration' }
        }
      },
      development: {
        id: 'development',
        name: 'Development Tools',
        topics: {
          ide: { id: 'ide', name: 'IDE/Editor Issues' },
          version_control: { id: 'version_control', name: 'Git/Version Control' },
          build_tools: { id: 'build_tools', name: 'Build/CI Tools' },
          container: { id: 'container', name: 'Docker/Containers' },
          api: { id: 'api', name: 'API/Integration Issues' }
        }
      },
      communication: {
        id: 'communication',
        name: 'Communication Tools',
        topics: {
          video_conferencing: { id: 'video_conferencing', name: 'Video Conferencing (Zoom, Teams)' },
          messaging: { id: 'messaging', name: 'Messaging Apps (Slack, Teams)' },
          voip: { id: 'voip', name: 'VoIP/Phone System' },
          screen_sharing: { id: 'screen_sharing', name: 'Screen Sharing Issues' }
        }
      },
      security: {
        id: 'security',
        name: 'Security Software',
        topics: {
          antivirus: { id: 'antivirus', name: 'Antivirus/Antimalware' },
          vpn: { id: 'vpn', name: 'VPN Client Issues' },
          firewall: { id: 'firewall', name: 'Firewall Configuration' },
          encryption: { id: 'encryption', name: 'Encryption/File Protection' }
        }
      }
    }
  },

  // =============================================================================
  // NETWORK ISSUES
  // =============================================================================
  network: {
    id: 'network',
    name: 'Network',
    icon: '🌐',
    description: 'Connectivity and network infrastructure problems',
    subcategories: {
      connectivity: {
        id: 'connectivity',
        name: 'Connectivity',
        topics: {
          no_internet: { id: 'no_internet', name: 'No Internet Access' },
          slow_connection: { id: 'slow_connection', name: 'Slow Connection' },
          intermittent: { id: 'intermittent', name: 'Intermittent Connection' },
          wifi: { id: 'wifi', name: 'WiFi Connection Issues' },
          ethernet: { id: 'ethernet', name: 'Ethernet/LAN Issues' }
        }
      },
      access: {
        id: 'access',
        name: 'Access & Permissions',
        topics: {
          website_access: { id: 'website_access', name: 'Website Access Issues' },
          shared_drive: { id: 'shared_drive', name: 'Shared Drive Access' },
          sharepoint: { id: 'sharepoint', name: 'SharePoint/OneDrive' },
          permissions: { id: 'permissions', name: 'Permission Denied Errors' }
        }
      },
      email: {
        id: 'email',
        name: 'Email & Messaging',
        topics: {
          cannot_send: { id: 'cannot_send', name: 'Cannot Send Email' },
          cannot_receive: { id: 'cannot_receive', name: 'Cannot Receive Email' },
          spam: { id: 'spam', name: 'Spam/Phishing Issues' },
          sync: { id: 'sync', name: 'Email Sync Problems' }
        }
      },
      infrastructure: {
        id: 'infrastructure',
        name: 'Infrastructure',
        topics: {
          dns: { id: 'dns', name: 'DNS Issues' },
          dhcp: { id: 'dhcp', name: 'DHCP Issues' },
          proxy: { id: 'proxy', name: 'Proxy Configuration' },
          bandwidth: { id: 'bandwidth', name: 'Bandwidth/Throttling' }
        }
      }
    }
  },

  // =============================================================================
  // ACCESS & SECURITY
  // =============================================================================
  access: {
    id: 'access',
    name: 'Access & Security',
    icon: '🔐',
    description: 'Account access, permissions, and security issues',
    subcategories: {
      authentication: {
        id: 'authentication',
        name: 'Authentication',
        topics: {
          password_reset: { id: 'password_reset', name: 'Password Reset' },
          lockout: { id: 'lockout', name: 'Account Locked Out' },
          mfa: { id: 'mfa', name: 'Multi-Factor Authentication' },
          sso: { id: 'sso', name: 'SSO/SAML Issues' },
          session: { id: 'session', name: 'Session Expiration Issues' }
        }
      },
      permissions: {
        id: 'permissions',
        name: 'Permissions & Access',
        topics: {
          file_access: { id: 'file_access', name: 'File/Folder Access' },
          application: { id: 'application', name: 'Application Access' },
          admin: { id: 'admin', name: 'Admin Privileges Request' },
          elevated: { id: 'elevated', name: 'Elevated Permissions' }
        }
      },
      security_incidents: {
        id: 'security_incidents',
        name: 'Security Incidents',
        topics: {
          suspicious_activity: { id: 'suspicious_activity', name: 'Suspicious Activity' },
          phishing: { id: 'phishing', name: 'Phishing Attempt' },
          malware: { id: 'malware', name: 'Malware/Ransomware Suspect' },
          data_breach: { id: 'data_breach', name: 'Data Breach Concern' },
          unauthorized_access: { id: 'unauthorized_access', name: 'Unauthorized Access' }
        }
      },
      compliance: {
        id: 'compliance',
        name: 'Compliance & Auditing',
        topics: {
          audit_request: { id: 'audit_request', name: 'Audit Request' },
          access_review: { id: 'access_review', name: 'Access Review' },
          data_request: { id: 'data_request', name: 'Data Export Request (GDPR)' },
          policy_violation: { id: 'policy_violation', name: 'Policy Violation Report' }
        }
      }
    }
  },

  // =============================================================================
  // DATA & STORAGE
  // =============================================================================
  data: {
    id: 'data',
    name: 'Data & Storage',
    icon: '💾',
    description: 'Data management, storage, and backup issues',
    subcategories: {
      storage: {
        id: 'storage',
        name: 'Storage',
        topics: {
          disk_full: { id: 'disk_full', name: 'Disk Full/No Space' },
          slow_performance: { id: 'slow_performance', name: 'Slow Storage Performance' },
          external: { id: 'external', name: 'External Drive Issues' },
          cloud_storage: { id: 'cloud_storage', name: 'Cloud Storage Sync' }
        }
      },
      backup: {
        id: 'backup',
        name: 'Backup & Recovery',
        topics: {
          backup_failed: { id: 'backup_failed', name: 'Backup Failed' },
          restore: { id: 'restore', name: 'Data Restore Request' },
          corruption: { id: 'corruption', name: 'File Corruption' },
          disaster_recovery: { id: 'disaster_recovery', name: 'Disaster Recovery' }
        }
      },
      database: {
        id: 'database',
        name: 'Database',
        topics: {
          connection: { id: 'connection', name: 'Database Connection' },
          query: { id: 'query', name: 'Query Performance' },
          migration: { id: 'migration', name: 'Data Migration' },
          replication: { id: 'replication', name: 'Replication/Sync Issues' }
        }
      },
      data_loss: {
        id: 'data_loss',
        name: 'Data Loss Prevention',
        topics: {
          accidental_delete: { id: 'accidental_delete', name: 'Accidentally Deleted Files' },
          recovery: { id: 'recovery', name: 'Data Recovery Request' },
          export: { id: 'export', name: 'Data Export' }
        }
      }
    }
  },

  // =============================================================================
  // ACCOUNT & BILLING
  // =============================================================================
  account: {
    id: 'account',
    name: 'Account & Billing',
    icon: '💳',
    description: 'Account management and billing inquiries',
    subcategories: {
      account_management: {
        id: 'account_management',
        name: 'Account Management',
        topics: {
          new_account: { id: 'new_account', name: 'New Account Setup' },
          account_update: { id: 'account_update', name: 'Account Information Update' },
          account_delete: { id: 'account_delete', name: 'Account Deletion Request' },
          transfer: { id: 'transfer', name: 'Account Transfer' }
        }
      },
      billing: {
        id: 'billing',
        name: 'Billing & Payments',
        topics: {
          invoice: { id: 'invoice', name: 'Invoice Inquiry' },
          payment_method: { id: 'payment_method', name: 'Payment Method Update' },
          refund: { id: 'refund', name: 'Refund Request' },
          subscription: { id: 'subscription', name: 'Subscription Changes' }
        }
      },
      licensing: {
        id: 'licensing',
        name: 'Licensing',
        topics: {
          license_key: { id: 'license_key', name: 'License Key Request' },
          license_transfer: { id: 'license_transfer', name: 'License Transfer' },
          license_renewal: { id: 'license_renewal', name: 'License Renewal' },
          compliance: { id: 'compliance', name: 'Software License Compliance' }
        }
      }
    }
  },

  // =============================================================================
  // TRAINING & SUPPORT
  // =============================================================================
  training: {
    id: 'training',
    name: 'Training & Support',
    icon: '📚',
    description: 'Training requests and general support inquiries',
    subcategories: {
      training_request: {
        id: 'training_request',
        name: 'Training Request',
        topics: {
          new_hire: { id: 'new_hire', name: 'New Hire Training' },
          software_training: { id: 'software_training', name: 'Software Training' },
          security_training: { id: 'security_training', name: 'Security Awareness Training' },
          best_practices: { id: 'best_practices', name: 'Best Practices Workshop' }
        }
      },
      how_to: {
        id: 'how_to',
        name: 'How-To Questions',
        topics: {
          feature_request: { id: 'feature_request', name: 'How to Use a Feature' },
          workflow: { id: 'workflow', name: 'How to Complete a Workflow' },
          integration: { id: 'integration', name: 'How to Set Up Integration' },
          automation: { id: 'automation', name: 'How to Automate Task' }
        }
      },
      documentation: {
        id: 'documentation',
        name: 'Documentation',
        topics: {
          user_guide: { id: 'user_guide', name: 'User Guide Request' },
          kb_article: { id: 'kb_article', name: 'Knowledge Base Article' },
          tutorial: { id: 'tutorial', name: 'Tutorial Request' }
        }
      },
      feedback: {
        id: 'feedback',
        name: 'Feedback & Suggestions',
        topics: {
          feature_suggestion: { id: 'feature_suggestion', name: 'Feature Suggestion' },
          improvement: { id: 'improvement', name: 'Improvement Request' },
          bug_report: { id: 'bug_report', name: 'Bug Report' },
          testimonial: { id: 'testimonial', name: 'Customer Testimonial' }
        }
      }
    }
  },

  // =============================================================================
  // OTHER
  // =============================================================================
  other: {
    id: 'other',
    name: 'Other',
    icon: '📋',
    description: 'Issues that do not fit other categories',
    subcategories: {
      general: {
        id: 'general',
        name: 'General Inquiry',
        topics: {
          general_question: { id: 'general_question', name: 'General Question' },
          vendor_issue: { id: 'vendor_issue', name: 'Third-Party Vendor Issue' },
          escalate: { id: 'escalate', name: 'Escalation Request' },
          urgent: { id: 'urgent', name: 'Urgent Priority Review' }
        }
      }
    }
  }
};

/**
 * Get all categories
 */
export function getCategories() {
  return Object.values(TICKET_CATEGORIES).map(({ id, name, icon, description }) => ({
    id,
    name,
    icon,
    description
  }));
}

/**
 * Get category with subcategories
 */
export function getCategory(categoryId) {
  const category = TICKET_CATEGORIES[categoryId];
  if (!category) return null;

  return {
    id: category.id,
    name: category.name,
    icon: category.icon,
    description: category.description,
    subcategories: Object.values(category.subcategories || {}).map(({ id, name }) => ({
      id,
      name
    }))
  };
}

/**
 * Get full hierarchy path
 */
export function getFullPath(categoryId, subcategoryId, topicId) {
  const category = TICKET_CATEGORIES[categoryId];
  if (!category) return null;

  const subcategory = category.subcategories?.[subcategoryId];
  if (!subcategory) return null;

  const topic = subcategory.topics?.[topicId];
  if (!topic) return null;

  return {
    category: { id: category.id, name: category.name, icon: category.icon },
    subcategory: { id: subcategory.id, name: subcategory.name },
    topic: { id: topic.id, name: topic.name }
  };
}

/**
 * Validate a category path
 */
export function validateCategoryPath(categoryId, subcategoryId, topicId) {
  const path = getFullPath(categoryId, subcategoryId, topicId);
  return path !== null;
}

/**
 * Get topic by ID path
 */
export function getTopic(categoryId, subcategoryId, topicId) {
  const category = TICKET_CATEGORIES[categoryId];
  if (!category?.subcategories?.[subcategoryId]?.topics?.[topicId]) {
    return null;
  }
  return category.subcategories[subcategoryId].topics[topicId];
}

export default TICKET_CATEGORIES;
