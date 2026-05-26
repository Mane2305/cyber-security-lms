export const MODULES = [
  {
    id: "module_01_phishing",
    title: "Phishing Awareness",
    description: "Learn to identify and avoid phishing attacks targeting employees via email",
    order: 1,
    badge_name: "Phishing Shield",
    slides: [
      {
        slide_number: 1,
        heading: "What is Phishing?",
        body: "Phishing is a fraudulent attempt to obtain sensitive information such as usernames, passwords, and credit card details by disguising as a trustworthy entity in an electronic communication, typically email. It is the most common form of cyber attack and the number one entry point for corporate data breaches.",
        key_points: [
          "Phishing emails impersonate trusted organizations like banks, IT departments, or executives",
          "The goal is to steal credentials, financial data, or install malware",
          "One click can compromise an entire organization"
        ]
      },
      {
        slide_number: 2,
        heading: "Red Flags of a Phishing Email",
        body: "Knowing what to look for is your best defense. Phishing emails use psychological tricks to rush you into acting without thinking. Common red flags include urgent or threatening language like 'Account Suspended', generic greetings like 'Dear Customer', suspicious links with mismatched URLs, and spelling or grammar mistakes.",
        key_points: [
          "Hover over links to reveal the real URL before clicking",
          "Check the sender's full email address, not just the display name",
          "Unexpected attachments from any sender should never be opened"
        ]
      },
      {
        slide_number: 3,
        heading: "Your Best Defense: Skepticism",
        body: "The golden rule is: if an email seems suspicious, it probably is. Do not click any links or download attachments. If you think the email might be legitimate, navigate to the company's website directly in a new browser tab and log in from there. Always report phishing attempts to your IT department immediately.",
        key_points: [
          "Never use links or contact info provided inside a suspicious email",
          "Go directly to the company website by typing the URL yourself",
          "Report every phishing attempt to IT — your report protects your whole team"
        ]
      }
    ]
  },
  {
    id: "module_02_passwords",
    title: "Passwords & Two-Factor Authentication",
    description: "Master strong password practices and secure your accounts with 2FA",
    order: 2,
    badge_name: "Password Guardian",
    slides: [
      {
        slide_number: 1,
        heading: "Why Weak Passwords Are Dangerous",
        body: "Attackers use automated software that can guess millions of passwords per second. Simple passwords like 'password123' or anything based on your name, birthday, or pet can be cracked almost instantly. A strong password is your first and most crucial line of defense against unauthorized access.",
        key_points: [
          "Automated tools can crack simple passwords in seconds",
          "Personal information like birthdays and names makes passwords easy to guess",
          "Reusing passwords across sites means one breach exposes all your accounts"
        ]
      },
      {
        slide_number: 2,
        heading: "The Pillars of a Strong Password",
        body: "A strong password should be at least 14 characters long. Each additional character makes it exponentially harder to crack. Use a mix of uppercase letters, lowercase letters, numbers, and symbols. Never reuse passwords across different websites — a breach on one site would expose all your accounts if you do.",
        key_points: [
          "Minimum 14 characters — length is the most important factor",
          "Mix uppercase, lowercase, numbers, and symbols like !@#$%",
          "Every account needs its own unique password, no exceptions"
        ]
      },
      {
        slide_number: 3,
        heading: "Password Managers and 2FA",
        body: "A trusted password manager generates, stores, and auto-fills ultra-strong passwords for you so you only need to remember one master password. Two-Factor Authentication (2FA) adds a second verification step — like a code from your phone — so even if an attacker steals your password, they cannot access your account.",
        key_points: [
          "Use a password manager to generate and store unique passwords for every site",
          "Enable 2FA on every account that supports it",
          "2FA means a stolen password alone is not enough for an attacker to get in"
        ]
      }
    ]
  },
  {
    id: "module_03_malware",
    title: "Malware & Ransomware",
    description: "Understand malware threats and how to protect your devices and data",
    order: 3,
    badge_name: "Malware Defender",
    slides: [
      {
        slide_number: 1,
        heading: "What is Malware?",
        body: "Malware is any software designed to harm your system or steal your data. It includes viruses, spyware, and trojans. Ransomware is a particularly dangerous type that encrypts all your files and holds them hostage until you pay a fee — often with no guarantee of recovery even after payment.",
        key_points: [
          "Malware includes viruses, spyware, trojans, and ransomware",
          "Ransomware encrypts your files and demands payment to restore them",
          "Paying the ransom does not guarantee you will get your files back"
        ]
      },
      {
        slide_number: 2,
        heading: "How Malware Spreads",
        body: "The number one way malware spreads is through phishing emails — clicking malicious links or opening infected attachments. Other vectors include downloading software from untrusted websites disguised as free utilities or games, and failing to update software. Attackers exploit known security holes in outdated operating systems, browsers, and applications.",
        key_points: [
          "Phishing emails with malicious attachments are the top infection method",
          "Never download software from unofficial or untrusted websites",
          "Keep your OS, browser, and all applications updated at all times"
        ]
      },
      {
        slide_number: 3,
        heading: "Your Defensive Strategy",
        body: "A multi-layered defense is key. Use a reputable antivirus program and keep it updated. Be extremely cautious about what you click and download. Most importantly, regularly back up your important files to an external drive or approved cloud service. Regular backups are your best and only guaranteed defense against ransomware.",
        key_points: [
          "Install and maintain reputable antivirus software on all devices",
          "Never click links or open attachments from unexpected emails",
          "Back up important files regularly — backups defeat ransomware completely"
        ]
      }
    ]
  },
  {
    id: "module_04_vishing",
    title: "Vishing & Smishing",
    description: "Recognize and respond to phone and SMS-based social engineering attacks",
    order: 4,
    badge_name: "Voice Defense",
    slides: [
      {
        slide_number: 1,
        heading: "Phishing Beyond Email",
        body: "Social engineering does not just happen in your inbox. Attackers also use phone calls and text messages to trick you. Vishing is voice phishing — fraudulent phone calls. Smishing is SMS phishing — fraudulent text messages. These attacks are often more convincing than email because they feel more personal and immediate.",
        key_points: [
          "Vishing uses phone calls to steal information or money",
          "Smishing uses text messages with malicious links or urgent requests",
          "These attacks feel more personal and are often harder to detect than email phishing"
        ]
      },
      {
        slide_number: 2,
        heading: "Common Scams and Tactics",
        body: "Common smishing attacks include fake bank alerts claiming your account is frozen with a link to a fake login page. Common vishing attacks include tech support scams — unsolicited calls claiming to be from Microsoft or Apple saying your computer is infected. Attackers also impersonate the IRS, delivery services, or your own company's IT helpdesk.",
        key_points: [
          "Fake bank alerts via SMS lead to credential-stealing fake login pages",
          "Tech support scams try to get remote access to your device or take payment",
          "Attackers impersonate authorities, companies, and even your own IT team"
        ]
      },
      {
        slide_number: 3,
        heading: "How to Respond",
        body: "The golden rule is: never trust, always verify. Do not click links in suspicious texts. Hang up on unsolicited calls. If the message claims to be from a company you use, contact them directly using a phone number or website you already know is legitimate. Never use the contact information provided in the suspicious message or call itself.",
        key_points: [
          "Hang up on any unsolicited call asking for information or payment",
          "Never use the phone number or link provided in a suspicious message to verify",
          "Always look up the company's official contact details independently"
        ]
      }
    ]
  },
  {
    id: "module_05_physical_security",
    title: "Physical & Remote Security",
    description: "Secure your physical workspace and remote working environment",
    order: 5,
    badge_name: "Security Sentinel",
    slides: [
      {
        slide_number: 1,
        heading: "Security is Not Just Digital",
        body: "Protecting information goes beyond firewalls and antivirus software. Physical security means protecting your devices and your screen from unauthorized access in the real world. A locked computer and an aware employee can prevent breaches that no software can stop. Never underestimate the physical dimension of cybersecurity.",
        key_points: [
          "Physical access to your screen or device is as dangerous as a digital attack",
          "Always lock your screen when stepping away, even for a moment",
          "Use Win+L on Windows or Cmd+Ctrl+Q on Mac to lock instantly"
        ]
      },
      {
        slide_number: 2,
        heading: "In the Office and On the Go",
        body: "Be aware of shoulder surfing — people watching you enter passwords or view sensitive data over your shoulder in public places like cafes, airports, or trains. Never leave laptops, phones, or tablets unattended. When traveling, keep all devices in your personal possession and never place them in checked luggage.",
        key_points: [
          "Be aware of who can see your screen in public spaces",
          "Never leave devices unattended in public, not even briefly",
          "Keep devices on your person when traveling, never in checked bags"
        ]
      },
      {
        slide_number: 3,
        heading: "The Dangers of Public Wi-Fi",
        body: "Public Wi-Fi is not secure. Attackers on the same network can potentially intercept your data using techniques like man-in-the-middle attacks. Avoid logging into sensitive accounts — banking, email, or work systems — on public Wi-Fi. If you must use public Wi-Fi, always connect through a trusted Virtual Private Network (VPN) to encrypt your traffic.",
        key_points: [
          "Public Wi-Fi allows attackers on the same network to intercept your data",
          "Never access bank, email, or work accounts on unsecured public Wi-Fi",
          "Always use a company-approved VPN when working remotely or traveling"
        ]
      }
    ]
  },
  {
    id: "module_06_data_handling",
    title: "Data Handling & Compliance",
    description: "Learn proper data handling practices and regulatory compliance requirements",
    order: 6,
    badge_name: "Data Protector",
    slides: [
      {
        slide_number: 1,
        heading: "Not All Data is Equal",
        body: "Data is classified by its sensitivity. Public data includes press releases. Internal data includes org charts and internal memos. Confidential or Restricted data includes personally identifiable information (PII), financial records, and health information. You have a legal and professional responsibility to handle each type appropriately.",
        key_points: [
          "Public data can be shared openly; confidential data requires strict protection",
          "PII, financial records, and health data are the most sensitive categories",
          "Mishandling confidential data can result in legal liability for you and the company"
        ]
      },
      {
        slide_number: 2,
        heading: "Secure Handling and Disposal",
        body: "Only access and share sensitive data with those who have a legitimate business need — this is called the need-to-know principle. Store confidential data on approved, encrypted systems only — not on personal devices or unsecured cloud services. When disposing of data, shred physical documents and securely delete digital files rather than simply moving them to the trash.",
        key_points: [
          "Only share sensitive data with people who have a legitimate need for it",
          "Never store confidential data on personal devices or unapproved cloud services",
          "Shred physical documents and securely delete digital files — trash is not enough"
        ]
      },
      {
        slide_number: 3,
        heading: "Incident Reporting",
        body: "If you suspect a security incident — you clicked a phishing link, lost a work device, see suspicious activity on your account, or accidentally shared sensitive data — you must report it immediately to your designated contact such as IT, InfoSec, or your manager. Fast reporting is critical. The longer an incident goes unreported, the greater the damage.",
        key_points: [
          "Report any suspected security incident immediately — do not wait",
          "Incidents include clicking phishing links, losing devices, or accidental data sharing",
          "Fast reporting limits damage and is required by most compliance regulations"
        ]
      }
    ]
  },
  {
    id: "module_07_social_engineering",
    title: "Social Engineering & Modern Scams",
    description: "Identify manipulation tactics and modern social engineering attacks",
    order: 7,
    badge_name: "Social Shield",
    slides: [
      {
        slide_number: 1,
        heading: "The Human Element",
        body: "Social engineering is the art of manipulating people so they give up confidential information or take harmful actions. Attackers know that humans are often the weakest link in the security chain. No firewall can protect against an employee who has been psychologically manipulated into handing over their credentials or authorizing a fraudulent transaction.",
        key_points: [
          "Social engineering targets people, not technology",
          "Attackers exploit trust, authority, urgency, and fear to manipulate victims",
          "You are the last line of defense that no software can replace"
        ]
      },
      {
        slide_number: 2,
        heading: "Modern Scam Tactics",
        body: "CEO Fraud or Business Email Compromise (BEC) involves an attacker impersonating an executive to urgently request a wire transfer or sensitive data from a finance employee. Deepfakes and AI voice cloning allow scammers to clone the voice of an executive or loved one. Baiting uses infected USB drives left in public spaces. Pretexting creates fabricated scenarios to extract personal information.",
        key_points: [
          "CEO Fraud targets finance employees with fake executive wire transfer requests",
          "AI voice cloning can convincingly impersonate executives or family members",
          "Never plug in unknown USB drives found in public — they can contain malware"
        ]
      },
      {
        slide_number: 3,
        heading: "Defending Against Manipulation",
        body: "Always verify unusual requests through a secondary channel, especially those involving money or sensitive data. If the CEO emails you for an urgent wire transfer, call them directly or speak in person to confirm before acting. Be skeptical of unsolicited offers, unexpected urgency, and any request that bypasses normal procedures. Slow down — urgency is a manipulation tactic.",
        key_points: [
          "Always verify financial or sensitive requests through a second independent channel",
          "Call the person directly using a number you already have, not one they provide",
          "Urgency is a red flag — legitimate requests can withstand a verification call"
        ]
      }
    ]
  },
  {
    id: "module_08_financial_scams",
    title: "Financial & Cryptocurrency Scams",
    description: "Recognize and avoid financial fraud, investment scams, and cryptocurrency attacks targeting employees",
    order: 8,
    badge_name: "Crypto Guardian",
    slides: [
      {
        slide_number: 1,
        heading: "Financial Fraud in the Workplace",
        body: "Financial scams targeting employees are increasingly sophisticated. Invoice fraud involves fake invoices sent to accounts payable teams requesting payment to attacker-controlled accounts. Payroll diversion scams trick HR into redirecting an employee's salary to a fraudulent account. These attacks often combine email spoofing with social engineering to appear completely legitimate.",
        key_points: [
          "Invoice fraud tricks finance teams into paying fake supplier invoices",
          "Payroll diversion attacks redirect your salary to attacker-controlled accounts",
          "Always verify payment detail changes through a phone call to a known number"
        ]
      },
      {
        slide_number: 2,
        heading: "Cryptocurrency Scams",
        body: "Cryptocurrency scams are now among the fastest-growing financial frauds. Common types include fake investment platforms promising guaranteed high returns, pig butchering scams where attackers build trust over weeks before convincing victims to invest, and crypto giveaway scams impersonating celebrities or companies. Once cryptocurrency is sent, it cannot be recovered.",
        key_points: [
          "Guaranteed high returns on crypto investments are always a scam",
          "Pig butchering scams build fake relationships over time before asking for money",
          "Cryptocurrency transactions are irreversible — lost funds cannot be recovered"
        ]
      },
      {
        slide_number: 3,
        heading: "Protecting Yourself and the Company",
        body: "Never make financial transactions based solely on email instructions, no matter how official they appear. Always call to verify using a number from your official company directory. Be extremely skeptical of any unsolicited investment opportunity, especially those involving cryptocurrency. Report any suspicious financial request to your manager and finance team immediately before taking any action.",
        key_points: [
          "Never process payments based only on email — always verify by phone",
          "No legitimate investment guarantees returns — that promise is the scam",
          "Report suspicious financial requests immediately before acting on them"
        ]
      }
    ]
  }
]
