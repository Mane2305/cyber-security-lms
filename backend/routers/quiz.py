from fastapi import APIRouter, HTTPException, Header
from services.auth_service import verify_token, get_user_from_firestore
from services.firebase_service import db
from services.completion_checker import is_certificate_eligible
from models.quiz import QuizStartRequest, AnswerSubmitRequest, QuizStartResponse, QuizSubmitResponse
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/api/quiz", tags=["quiz"])

# --- AUTH DEPENDENCY ---
def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail={"error": "AUTH_TOKEN_MISSING"})
    token = authorization.replace("Bearer ", "")
    decoded = verify_token(token)
    uid = decoded.get("uid")
    return get_user_from_firestore(uid)

# --- MODULE ORDER MAP ---
MODULE_ORDER = {
    "module_01_phishing": 1,
    "module_02_passwords": 2,
    "module_03_malware": 3,
    "module_04_vishing": 4,
    "module_05_physical_security": 5,
    "module_06_data_handling": 6,
    "module_07_social_engineering": 7,
    "module_08_financial_scams": 8,
}

MODULE_SEQUENCE = [
    "module_01_phishing",
    "module_02_passwords",
    "module_03_malware",
    "module_04_vishing",
    "module_05_physical_security",
    "module_06_data_handling",
    "module_07_social_engineering",
    "module_08_financial_scams",
]

# --- STATIC QUESTIONS PER MODULE ---
STATIC_QUESTIONS = {
    "module_01_phishing": [
        {
            "question_number": 1,
            "question_text": "You receive an email from your bank saying your account is suspended and you must click a link to verify your identity immediately. What should you do?",
            "options": [
                "Click the link and enter your credentials to restore access",
                "Reply to the email asking for more information",
                "Close the email, open a new browser tab, and go directly to your bank's official website",
                "Forward the email to your colleagues to warn them"
            ],
            "correct_answer_index": 2,
            "explanation": "Always go directly to the official website by typing the URL yourself. Legitimate banks never ask you to click email links to verify credentials.",
            "hint": "Think about what a legitimate bank would actually ask you to do."
        },
        {
            "question_number": 2,
            "question_text": "An email from 'PayPal Support' uses the greeting 'Dear Customer' and asks you to confirm your account details. Which red flag does this represent?",
            "options": [
                "The email is too short",
                "Generic greeting instead of your actual name",
                "The email arrived on a weekend",
                "PayPal never sends emails"
            ],
            "correct_answer_index": 1,
            "explanation": "Legitimate companies that have your account on file will address you by your actual name. 'Dear Customer' is a classic sign of a mass phishing campaign.",
            "hint": "Think about how legitimate companies address their customers."
        },
        {
            "question_number": 3,
            "question_text": "You hover over a link in an email that says 'Click here to update your Microsoft account' and see the URL is 'http://microsoft-update.fakesite.net'. What should you do?",
            "options": [
                "Click the link because Microsoft is a trusted company",
                "Click the link only if you are using antivirus software",
                "Do not click — the URL does not match Microsoft's official domain",
                "Click the link and check if the page looks legitimate before entering any data"
            ],
            "correct_answer_index": 2,
            "explanation": "The URL is not microsoft.com. Attackers use domains that look similar to fool victims. Always verify the full URL before clicking any link in an email.",
            "hint": "Look carefully at the actual domain in the URL."
        },
        {
            "question_number": 4,
            "question_text": "You receive an unexpected email with a PDF attachment from a colleague you know. What is the safest action?",
            "options": [
                "Open it immediately since it is from someone you know",
                "Open it only if your antivirus does not flag it",
                "Contact your colleague through a separate channel to verify they sent it before opening",
                "Save it to your desktop and open it later"
            ],
            "correct_answer_index": 2,
            "explanation": "Attackers frequently compromise or spoof known contacts' email addresses. Always verify through a separate channel — a call or message — before opening unexpected attachments.",
            "hint": "Could a colleague's email be compromised or spoofed?"
        },
        {
            "question_number": 5,
            "question_text": "After identifying a phishing email in your inbox, what is the correct next step?",
            "options": [
                "Delete it immediately so no one else can click it",
                "Reply to the sender telling them you know it is a scam",
                "Report it to your IT or security team and then delete it",
                "Forward it to your manager for approval before deleting"
            ],
            "correct_answer_index": 2,
            "explanation": "Reporting phishing emails to your IT or security team allows them to investigate, block the sender, and protect the whole organization. Deleting without reporting means the threat goes unaddressed.",
            "hint": "Who in your organization needs to know about security threats?"
        }
    ],
    "module_02_passwords": [
        {
            "question_number": 1,
            "question_text": "Which of the following passwords is the strongest?",
            "options": [
                "Password123",
                "John1990!",
                "Tr!v1aG@me$2024",
                "qwerty12345"
            ],
            "correct_answer_index": 2,
            "explanation": "Tr!v1aG@me$2024 uses a mix of uppercase, lowercase, numbers, and symbols and is over 14 characters. The others are based on dictionary words, personal info, or keyboard patterns.",
            "hint": "Which password uses the most variety and length?"
        },
        {
            "question_number": 2,
            "question_text": "You use the same password for your work email, LinkedIn, and online banking. One of these services is breached. What is the risk?",
            "options": [
                "Only the breached service is at risk",
                "All three accounts are at risk because attackers try stolen credentials across multiple sites",
                "No risk if you change the breached account's password quickly",
                "Only accounts on the same device are at risk"
            ],
            "correct_answer_index": 1,
            "explanation": "This is called credential stuffing. Attackers automatically try stolen username and password combinations across hundreds of services. Reusing passwords multiplies the damage of any single breach.",
            "hint": "What do attackers do with stolen credentials after a breach?"
        },
        {
            "question_number": 3,
            "question_text": "What is the primary benefit of using a password manager?",
            "options": [
                "It remembers your one password for everything",
                "It generates and stores unique complex passwords for every account so you only remember one master password",
                "It protects your accounts even if your master password is stolen",
                "It automatically changes your passwords every month"
            ],
            "correct_answer_index": 1,
            "explanation": "A password manager lets you have a unique, complex password for every account without needing to memorize them. You only need to remember your single master password.",
            "hint": "What is the core problem a password manager solves?"
        },
        {
            "question_number": 4,
            "question_text": "An attacker has stolen your password for an account that has 2FA enabled. Can they access your account?",
            "options": [
                "Yes, if they have your password they have full access",
                "Yes, but only within 24 hours of stealing it",
                "No, they would also need the second factor such as your phone to get in",
                "No, stolen passwords are automatically invalidated"
            ],
            "correct_answer_index": 2,
            "explanation": "2FA requires a second verification step — typically a one-time code sent to your phone. Even with your password, an attacker cannot get in without also having physical access to your second factor.",
            "hint": "What does 2FA literally mean in terms of what is required to log in?"
        },
        {
            "question_number": 5,
            "question_text": "How many characters should a strong password be at minimum?",
            "options": [
                "6 characters",
                "8 characters",
                "10 characters",
                "14 characters"
            ],
            "correct_answer_index": 3,
            "explanation": "The recommended minimum for a strong password is 14 characters. Each additional character makes the password exponentially harder to crack with automated tools.",
            "hint": "Think about what makes length so important in password security."
        }
    ],
    "module_03_malware": [
        {
            "question_number": 1,
            "question_text": "Your computer files suddenly show a .locked extension and a message appears demanding payment to restore them. What type of malware is this?",
            "options": [
                "Spyware",
                "Ransomware",
                "Adware",
                "Trojan"
            ],
            "correct_answer_index": 1,
            "explanation": "Ransomware encrypts your files and demands payment for the decryption key. The .locked extension and ransom demand are classic indicators of a ransomware infection.",
            "hint": "Which type of malware specifically targets your files for encryption?"
        },
        {
            "question_number": 2,
            "question_text": "What is the single most effective defense against ransomware?",
            "options": [
                "Paying the ransom quickly to minimize damage",
                "Having antivirus software installed",
                "Regular backups of your files stored separately from your main system",
                "Never connecting to the internet"
            ],
            "correct_answer_index": 2,
            "explanation": "If you have clean backups, ransomware becomes an inconvenience rather than a disaster — you restore from backup and do not pay. Paying the ransom does not guarantee file recovery.",
            "hint": "What allows you to recover completely without needing to pay?"
        },
        {
            "question_number": 3,
            "question_text": "Why is keeping your operating system and software updated critical for malware defense?",
            "options": [
                "Updates make your computer run faster",
                "Updates include new features that attackers cannot exploit",
                "Attackers exploit known security holes in outdated software that updates patch",
                "Updated software cannot be infected with malware"
            ],
            "correct_answer_index": 2,
            "explanation": "Software updates frequently include security patches for known vulnerabilities. Attackers actively target unpatched systems because the exploit is already known and documented.",
            "hint": "What do security patches in updates actually fix?"
        },
        {
            "question_number": 4,
            "question_text": "You find a website offering a free version of expensive software. What is the security risk?",
            "options": [
                "No risk if the website looks professional",
                "The free software could be bundled with malware",
                "The software might not have all features",
                "No risk if you scan it with antivirus first"
            ],
            "correct_answer_index": 1,
            "explanation": "Malicious downloads often disguise malware as free or cracked software. Even antivirus scanning is not 100% reliable against new or sophisticated malware. Only download software from official sources.",
            "hint": "What is the common method attackers use to distribute malware via downloads?"
        },
        {
            "question_number": 5,
            "question_text": "What is the number one way malware spreads in corporate environments?",
            "options": [
                "Through infected USB drives",
                "Through phishing emails with malicious links or attachments",
                "Through outdated antivirus software",
                "Through weak Wi-Fi passwords"
            ],
            "correct_answer_index": 1,
            "explanation": "Phishing emails containing malicious links or infected attachments are the primary malware delivery mechanism in corporate environments. This is why phishing awareness is the first module in this course.",
            "hint": "Think about how attackers get malware onto a target's machine."
        }
    ],
    "module_04_vishing": [
        {
            "question_number": 1,
            "question_text": "You receive a text message saying your bank account has been suspended with a link to verify your identity. What is this attack called and what should you do?",
            "options": [
                "Vishing — click the link to restore your account",
                "Smishing — do not click the link, contact your bank directly using their official number",
                "Phishing — forward the message to your bank's email",
                "Malware — delete the message and restart your phone"
            ],
            "correct_answer_index": 1,
            "explanation": "This is smishing (SMS phishing). You should never click links in suspicious texts. Contact your bank directly using the number on the back of your card or their official website.",
            "hint": "What type of phishing uses text messages?"
        },
        {
            "question_number": 2,
            "question_text": "An unsolicited caller claims to be from Microsoft and says your computer is sending error reports and is infected. They want to help you fix it remotely. What should you do?",
            "options": [
                "Allow the remote access since Microsoft is a trusted company",
                "Give them your IP address so they can diagnose the issue",
                "Hang up immediately — Microsoft does not make unsolicited support calls",
                "Ask them to send you an email instead"
            ],
            "correct_answer_index": 2,
            "explanation": "Microsoft, Apple, and other major tech companies do not make unsolicited calls to fix your computer. This is a classic tech support vishing scam designed to get remote access to your device or steal payment.",
            "hint": "Do legitimate tech companies make unsolicited calls to fix your computer?"
        },
        {
            "question_number": 3,
            "question_text": "A caller claims to be from your company's IT helpdesk and asks for your password to fix a critical security issue. What is the correct response?",
            "options": [
                "Provide the password since IT helpdesk needs it to help you",
                "Provide only your username, not your password",
                "Refuse — legitimate IT staff never need your password",
                "Ask them to send a password reset email instead"
            ],
            "correct_answer_index": 2,
            "explanation": "Legitimate IT helpdesk staff never need your password. They have administrative access to fix issues without your credentials. Any caller asking for your password is attempting a social engineering attack.",
            "hint": "Why would a real IT professional need your password?"
        },
        {
            "question_number": 4,
            "question_text": "You receive a suspicious text claiming to be from a delivery company with a link to reschedule a delivery. You are expecting a package. What should you do?",
            "options": [
                "Click the link since you are expecting a delivery",
                "Do not click the link — go directly to the delivery company's official website to check your delivery status",
                "Reply to the text asking for more information",
                "Ignore it and your package will be returned to sender"
            ],
            "correct_answer_index": 1,
            "explanation": "Even if you are expecting a delivery, never click links in unexpected texts. Go directly to the carrier's official website using a URL you find yourself, not the one provided in the message.",
            "hint": "Does the context of expecting a delivery make the link in the text safe to click?"
        },
        {
            "question_number": 5,
            "question_text": "What is the golden rule when receiving any unsolicited call or text requesting personal information or action?",
            "options": [
                "Trust but verify — provide the information then check if it was legitimate",
                "Never trust, always verify — contact the organization directly using contact details you find independently",
                "Only provide information if the caller knows your name",
                "Ask the caller to hold while you check with a colleague"
            ],
            "correct_answer_index": 1,
            "explanation": "Never trust the contact information provided in an unsolicited message. Always look up the organization's official contact details independently and use those to verify before taking any action.",
            "hint": "What is the key phrase taught in this module about trust and verification?"
        }
    ],
    "module_05_physical_security": [
        {
            "question_number": 1,
            "question_text": "You step away from your desk for 5 minutes to get coffee. What should you do with your computer?",
            "options": [
                "Leave it open since you will be back quickly",
                "Lock your screen before leaving using Win+L or Cmd+Ctrl+Q",
                "Close all your application windows but leave the screen unlocked",
                "Only lock it if you are leaving for more than 30 minutes"
            ],
            "correct_answer_index": 1,
            "explanation": "Always lock your screen every time you step away, even for a moment. It takes less than a second and prevents anyone from accessing your work, reading sensitive emails, or installing software.",
            "hint": "How long does it take to lock a screen and what could happen in 5 minutes?"
        },
        {
            "question_number": 2,
            "question_text": "You are working on a confidential client proposal on your laptop in a busy airport. What is the primary physical security threat?",
            "options": [
                "Someone hacking your laptop wirelessly",
                "Shoulder surfing — someone reading your screen over your shoulder",
                "Your laptop overheating in the airport",
                "Public Wi-Fi automatically downloading malware"
            ],
            "correct_answer_index": 1,
            "explanation": "Shoulder surfing is a real and common threat in public spaces. Attackers can read sensitive information directly from your screen. Use a privacy screen filter and be aware of who is around you.",
            "hint": "What can someone physically near you do without touching your device?"
        },
        {
            "question_number": 3,
            "question_text": "Why should you avoid logging into your work email or banking accounts on public Wi-Fi without a VPN?",
            "options": [
                "Public Wi-Fi is slower so it is less secure",
                "Attackers on the same public network can intercept your unencrypted data",
                "Public Wi-Fi automatically logs out your sessions",
                "Public Wi-Fi does not support secure HTTPS connections"
            ],
            "correct_answer_index": 1,
            "explanation": "Attackers on the same public Wi-Fi network can use techniques like man-in-the-middle attacks to intercept your traffic. A VPN encrypts your connection making interception impractical.",
            "hint": "What can someone on the same Wi-Fi network potentially do to your data?"
        },
        {
            "question_number": 4,
            "question_text": "You are traveling for a business trip. Where is the safest place to keep your work laptop overnight?",
            "options": [
                "In your checked luggage since it is locked",
                "In the hotel safe",
                "Under your bed in the hotel room",
                "In the hotel lobby luggage storage"
            ],
            "correct_answer_index": 1,
            "explanation": "A hotel safe is the most secure option for storing devices overnight. Checked luggage can be accessed by handlers and is not appropriate for sensitive equipment. Never leave devices where they could be easily stolen.",
            "hint": "Which option provides both physical security and your control over access?"
        },
        {
            "question_number": 5,
            "question_text": "What does a VPN do to protect your connection on public Wi-Fi?",
            "options": [
                "It hides your device from the Wi-Fi network entirely",
                "It encrypts your internet traffic so intercepted data cannot be read",
                "It automatically detects and blocks hackers on the network",
                "It gives you a faster and more secure connection"
            ],
            "correct_answer_index": 1,
            "explanation": "A VPN creates an encrypted tunnel for your internet traffic. Even if an attacker intercepts your data on public Wi-Fi, the encryption makes it unreadable to them.",
            "hint": "What property of a VPN makes intercepted data useless to an attacker?"
        }
    ],
    "module_06_data_handling": [
        {
            "question_number": 1,
            "question_text": "A colleague in a different department asks you to share a confidential client database to help with a project. They are a trusted employee. What should you do?",
            "options": [
                "Share it since they are a trusted employee",
                "Share only a summary, not the full database",
                "Check if they have a legitimate business need and proper authorization before sharing",
                "Share it but ask them to delete it when done"
            ],
            "correct_answer_index": 2,
            "explanation": "The need-to-know principle means data should only be shared with those who have a documented legitimate business need and proper authorization — regardless of how trusted they are.",
            "hint": "What principle governs who should have access to sensitive data?"
        },
        {
            "question_number": 2,
            "question_text": "You need to dispose of printed documents containing employee salary information. What is the correct method?",
            "options": [
                "Tear them up before putting them in the bin",
                "Put them in a recycling bin since it is better for the environment",
                "Shred them using a cross-cut or micro-cut shredder",
                "Burn them if a shredder is not available"
            ],
            "correct_answer_index": 2,
            "explanation": "Sensitive physical documents must be shredded with a cross-cut or micro-cut shredder. Tearing by hand leaves pieces that can be reassembled. Recycling bins expose the data to anyone who looks.",
            "hint": "Which method makes document reconstruction impossible?"
        },
        {
            "question_number": 3,
            "question_text": "Which of the following is an example of Personally Identifiable Information (PII)?",
            "options": [
                "The company's public press release",
                "An employee's national ID number and home address",
                "The organization chart showing department names",
                "A published product brochure"
            ],
            "correct_answer_index": 1,
            "explanation": "PII is any data that can be used to identify a specific individual — national ID numbers, addresses, phone numbers, and similar personal details. This type of data requires the highest level of protection.",
            "hint": "Which information could be used to identify and locate a specific person?"
        },
        {
            "question_number": 4,
            "question_text": "You accidentally click a phishing link at work and realize it may have captured your login credentials. What should you do first?",
            "options": [
                "Wait and see if anything suspicious happens before reporting",
                "Immediately report the incident to IT or your security team",
                "Change your password quietly and hope for the best",
                "Tell your colleague but not the IT team to avoid getting in trouble"
            ],
            "correct_answer_index": 1,
            "explanation": "Immediate reporting is essential. Every minute of delay gives attackers more time to use your credentials or install malware. Reporting is not about blame — it is about protecting the organization.",
            "hint": "What does time mean in a security incident?"
        },
        {
            "question_number": 5,
            "question_text": "You want to work on a confidential document from home. Which is the safest approach?",
            "options": [
                "Email it to your personal Gmail so you can access it from home",
                "Copy it to a personal USB drive and take it home",
                "Access it through your company's approved remote access system or VPN",
                "Take a photo of the document on your phone for reference"
            ],
            "correct_answer_index": 2,
            "explanation": "Confidential data must only be accessed through approved, encrypted company systems. Emailing to personal accounts, personal USB drives, and phone photos all create unauthorized copies outside company security controls.",
            "hint": "Which method keeps the data within your company's security controls?"
        }
    ],
    "module_07_social_engineering": [
        {
            "question_number": 1,
            "question_text": "An attacker sends an email appearing to be from your CEO to your finance colleague urgently requesting a $50,000 wire transfer to a new vendor before end of day. What type of attack is this?",
            "options": [
                "Ransomware",
                "CEO Fraud / Business Email Compromise (BEC)",
                "Smishing",
                "Baiting"
            ],
            "correct_answer_index": 1,
            "explanation": "This is Business Email Compromise — a sophisticated social engineering attack where attackers impersonate executives to trick finance employees into making fraudulent wire transfers. It costs businesses billions annually.",
            "hint": "What is the name for attacks that impersonate executives to request fraudulent transfers?"
        },
        {
            "question_number": 2,
            "question_text": "Your finance colleague receives what appears to be a wire transfer request from the CEO. What is the correct verification step?",
            "options": [
                "Check that the email address looks correct",
                "Reply to the email and ask for confirmation",
                "Call the CEO directly using a phone number from the company directory to confirm",
                "Ask another colleague if the CEO mentioned this transfer"
            ],
            "correct_answer_index": 2,
            "explanation": "Email addresses can be spoofed and reply-to addresses redirected. The only reliable verification for unusual financial requests is a direct call to a number you already have from the official company directory.",
            "hint": "Which method cannot be faked by an attacker who controls the email thread?"
        },
        {
            "question_number": 3,
            "question_text": "You find a USB drive labeled 'Employee Salaries 2026' in the company parking lot. What should you do?",
            "options": [
                "Plug it into your computer to see if it belongs to a colleague so you can return it",
                "Hand it to IT or security without plugging it in anywhere",
                "Plug it into a computer not connected to the internet",
                "Keep it in case it is useful later"
            ],
            "correct_answer_index": 1,
            "explanation": "This is a baiting attack. The attractive label is designed to make you curious enough to plug it in. An infected USB can compromise your device the moment it is connected, even before you open any files.",
            "hint": "What is the technique called when attackers leave infected devices in public spaces?"
        },
        {
            "question_number": 4,
            "question_text": "An AI-generated voice call convincingly sounds like your manager asking you to approve an urgent payment. You are unsure. What is the best response?",
            "options": [
                "Approve it since the voice sounds exactly like your manager",
                "Ask the caller security questions to verify their identity",
                "End the call and physically speak to your manager or call them back on a known number to verify",
                "Delay approving it until the next business day"
            ],
            "correct_answer_index": 2,
            "explanation": "AI voice cloning can replicate voices convincingly. The only reliable defense is to end the call and initiate contact yourself using a number you already have. Do not trust the callback number the caller provides.",
            "hint": "Can you trust that a voice on a call is who it claims to be?"
        },
        {
            "question_number": 5,
            "question_text": "What is pretexting in the context of social engineering?",
            "options": [
                "Sending fake text messages to steal credentials",
                "Creating a fabricated scenario to manipulate someone into revealing information",
                "Pretending to be a technical expert to gain trust",
                "Using technical exploits before a social engineering attack"
            ],
            "correct_answer_index": 1,
            "explanation": "Pretexting involves creating a believable false scenario to extract information. For example, pretending to be a researcher, bank official, or IT auditor to get someone to reveal sensitive data they would not otherwise share.",
            "hint": "What does the 'pretext' in pretexting mean?"
        }
    ],
    "module_08_financial_scams": [
        {
            "question_number": 1,
            "question_text": "Your accounts payable team receives a professional email from a known supplier saying their bank account details have changed, with a new account number for future payments. What should you do?",
            "options": [
                "Update the account details since the email looks legitimate",
                "Update only after checking the email domain carefully",
                "Call the supplier directly using a phone number from your existing records to verify the change",
                "Ask the supplier to resend the request on company letterhead"
            ],
            "correct_answer_index": 2,
            "explanation": "Invoice fraud and payment redirection is a major corporate threat. Always verify any change to payment details by calling the supplier using a number from your existing records — not the number in the email.",
            "hint": "What happens to payments after attacker-controlled bank details replace legitimate ones?"
        },
        {
            "question_number": 2,
            "question_text": "A platform you found online promises 300% returns on cryptocurrency investments with zero risk and shows testimonials from celebrities. What is this?",
            "options": [
                "A legitimate high-yield investment opportunity",
                "A cryptocurrency scam — guaranteed high returns are always a warning sign",
                "A legitimate platform if the celebrity testimonials are verified",
                "A risky but potentially profitable investment"
            ],
            "correct_answer_index": 1,
            "explanation": "No legitimate investment guarantees returns, especially 300%. Celebrity testimonials on crypto platforms are often fabricated or made without the celebrity's knowledge using deepfakes. Guaranteed returns are the single biggest red flag for investment fraud.",
            "hint": "What does a guarantee of returns on any investment tell you about its legitimacy?"
        },
        {
            "question_number": 3,
            "question_text": "Someone you met online over several weeks has built a close friendship and now recommends a specific cryptocurrency investment platform showing you their own impressive gains. This is likely what type of scam?",
            "options": [
                "Phishing",
                "Vishing",
                "Pig butchering scam",
                "Ponzi scheme"
            ],
            "correct_answer_index": 2,
            "explanation": "Pig butchering is a long-term social engineering scam. The attacker invests weeks building trust and affection before introducing a fake investment platform. The gains shown are fabricated to build confidence before taking a large final deposit.",
            "hint": "Which scam type is specifically characterized by building a relationship over time before introducing the investment?"
        },
        {
            "question_number": 4,
            "question_text": "If you send cryptocurrency to a scammer, what is the realistic chance of recovering those funds?",
            "options": [
                "High — cryptocurrency transactions can be reversed by your bank",
                "Medium — law enforcement can freeze the funds if you report quickly",
                "Low — cryptocurrency transactions are irreversible and very difficult to trace",
                "Zero risk if you used a regulated exchange"
            ],
            "correct_answer_index": 2,
            "explanation": "Unlike bank transfers, cryptocurrency transactions cannot be reversed. Once funds are sent, recovery is extremely unlikely. This is why attackers specifically prefer cryptocurrency payments for scams.",
            "hint": "What is a fundamental property of blockchain transactions?"
        },
        {
            "question_number": 5,
            "question_text": "Your HR manager receives an email appearing to be from an employee asking to update their direct deposit details to a new bank account. What is the correct process?",
            "options": [
                "Update it since it came from the employee's work email",
                "Update it after the employee confirms via a reply email",
                "Verify by calling or speaking to the employee directly using their known contact details before making any changes",
                "Forward it to payroll without further verification"
            ],
            "correct_answer_index": 2,
            "explanation": "Payroll diversion fraud starts with exactly this type of email. Work emails can be compromised or spoofed. Always verify payroll changes by speaking directly with the employee through a channel you already have.",
            "hint": "Can an employee's work email account be compromised by an attacker?"
        }
    ]
}


# --- ENDPOINTS ---

@router.post("/start")
def start_quiz(
    request: QuizStartRequest,
    authorization: str = Header(...)
):
    user = get_current_user(authorization)

    if user.get("role") != "employee":
        raise HTTPException(status_code=403, detail={"error": "AUTH_INSUFFICIENT_ROLE"})

    module_id = request.module_id

    # Check module is unlocked
    progress_ref = db.collection("employee_progress").document(user["uid"])
    progress = progress_ref.get()
    if not progress.exists:
        raise HTTPException(status_code=403, detail={"error": "MODULE_LOCKED"})

    progress_data = progress.to_dict()
    if module_id not in progress_data.get("modules_unlocked", []):
        raise HTTPException(status_code=403, detail={"error": "MODULE_LOCKED"})

    # Get static questions for this module
    questions_data = STATIC_QUESTIONS.get(module_id)
    if not questions_data:
        raise HTTPException(status_code=404, detail={"error": "MODULE_NOT_FOUND"})

    # Determine attempt number
    existing_attempts = db.collection("quiz_attempts") \
        .where("uid", "==", user["uid"]) \
        .where("module_id", "==", module_id) \
        .stream()
    attempt_number = len(list(existing_attempts)) + 1

    # Create attempt document
    attempt_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    attempt_doc = {
        "attempt_id": attempt_id,
        "uid": user["uid"],
        "tenant_id": user["tenant_id"],
        "module_id": module_id,
        "attempt_number": attempt_number,
        "started_at": now,
        "submitted_at": None,
        "questions": questions_data,
        "answers_submitted": None,
        "score": None,
        "passed": None,
        "weak_area_feedback": None,
        "status": "active"
    }

    db.collection("quiz_attempts").document(attempt_id).set(attempt_doc)

    # Write activity log
    db.collection("activity_log").add({
        "tenant_id": user["tenant_id"],
        "uid": user["uid"],
        "action": "quiz_started",
        "module_id": module_id,
        "metadata": {"attempt_number": attempt_number},
        "timestamp": now
    })

    # Return questions WITHOUT correct_answer_index
    questions_for_frontend = [
        {
            "question_number": q["question_number"],
            "question_text": q["question_text"],
            "options": q["options"],
            "hint": q.get("hint")
        }
        for q in questions_data
    ]

    return {
        "success": True,
        "data": {
            "attempt_id": attempt_id,
            "module_id": module_id,
            "questions": questions_for_frontend
        }
    }


@router.post("/submit")
def submit_quiz(
    request: AnswerSubmitRequest,
    authorization: str = Header(...)
):
    user = get_current_user(authorization)

    if user.get("role") != "employee":
        raise HTTPException(status_code=403, detail={"error": "AUTH_INSUFFICIENT_ROLE"})

    if len(request.answers) != 5:
        raise HTTPException(status_code=400, detail={"error": "VALIDATION_ERROR", "message": "Exactly 5 answers required"})

    # Fetch attempt
    attempt_ref = db.collection("quiz_attempts").document(request.attempt_id)
    attempt = attempt_ref.get()
    if not attempt.exists:
        raise HTTPException(status_code=404, detail={"error": "QUIZ_NOT_FOUND"})

    attempt_data = attempt.to_dict()

    # Verify this attempt belongs to this user
    if attempt_data["uid"] != user["uid"]:
        raise HTTPException(status_code=403, detail={"error": "AUTH_INSUFFICIENT_ROLE"})

    questions = attempt_data["questions"]
    submitted_answers = request.answers

    # Score
    correct_count = 0
    results = []
    for i, question in enumerate(questions):
        is_correct = submitted_answers[i] == question["correct_answer_index"]
        if is_correct:
            correct_count += 1
        results.append({
            "question_number": question["question_number"],
            "correct": is_correct,
            "correct_option_index": question["correct_answer_index"],
            "explanation": question["explanation"]
        })

    total_questions = 5
    score = int((correct_count / total_questions) * 100)
    pass_threshold = 70
    passed = score >= pass_threshold

    now = datetime.now(timezone.utc)
    module_id = attempt_data["module_id"]
    uid = user["uid"]
    tenant_id = user["tenant_id"]

    badge_unlocked = False
    next_module_unlocked = None
    certificate_eligible = False

    # If passed: update employee_progress
    if passed:
        progress_ref = db.collection("employee_progress").document(uid)
        progress_data = progress_ref.get().to_dict()

        modules_completed = progress_data.get("modules_completed", [])
        modules_unlocked = progress_data.get("modules_unlocked", [])
        badges_earned = progress_data.get("badges_earned", [])

        # Add to completed if not already there
        if module_id not in modules_completed:
            modules_completed.append(module_id)

            # Unlock next module
            current_order = MODULE_ORDER.get(module_id, 0)
            if current_order < 8:
                next_module = MODULE_SEQUENCE[current_order]  # current_order is 0-indexed here, next is current_order
                if next_module not in modules_unlocked:
                    modules_unlocked.append(next_module)
                    next_module_unlocked = next_module

            # Award badge
            module_doc = db.collection("modules").document(module_id).get()
            badge_name = module_doc.to_dict().get("badge_name", "") if module_doc.exists else ""
            already_has_badge = any(b["module_id"] == module_id for b in badges_earned)
            if not already_has_badge:
                badges_earned.append({
                    "module_id": module_id,
                    "badge_name": badge_name,
                    "earned_at": now
                })
                badge_unlocked = True

            # Check certificate eligibility
            certificate_eligible = len(modules_completed) >= 8

            progress_ref.update({
                "modules_completed": modules_completed,
                "modules_unlocked": modules_unlocked,
                "badges_earned": badges_earned,
                "last_module_completed_at": now,
                "updated_at": now
            })

            # Write activity log entries
            db.collection("activity_log").add({
                "tenant_id": tenant_id,
                "uid": uid,
                "action": "module_completed",
                "module_id": module_id,
                "metadata": {"score": score, "attempt_number": attempt_data["attempt_number"]},
                "timestamp": now
            })
            db.collection("activity_log").add({
                "tenant_id": tenant_id,
                "uid": uid,
                "action": "quiz_passed",
                "module_id": module_id,
                "metadata": {"score": score, "attempt_number": attempt_data["attempt_number"]},
                "timestamp": now
            })
            if badge_unlocked:
                db.collection("activity_log").add({
                    "tenant_id": tenant_id,
                    "uid": uid,
                    "action": "badge_earned",
                    "module_id": module_id,
                    "metadata": {"badge_name": badge_name},
                    "timestamp": now
                })
    else:
        # Log quiz failed
        db.collection("activity_log").add({
            "tenant_id": tenant_id,
            "uid": uid,
            "action": "quiz_failed",
            "module_id": module_id,
            "metadata": {"score": score, "attempt_number": attempt_data["attempt_number"]},
            "timestamp": now
        })

    # Update attempt document
    attempt_ref.update({
        "submitted_at": now,
        "answers_submitted": submitted_answers,
        "score": score,
        "passed": passed,
        "weak_area_feedback": None,  # Chunk 4 will fill this via Groq
        "status": "submitted"
    })

    return {
        "success": True,
        "data": {
            "attempt_id": request.attempt_id,
            "module_id": module_id,
            "score": score,
            "passed": passed,
            "pass_threshold": pass_threshold,
            "correct_count": correct_count,
            "total_questions": total_questions,
            "results": results,
            "weak_area_feedback": None,
            "badge_unlocked": badge_unlocked,
            "next_module_unlocked": next_module_unlocked,
            "certificate_eligible": certificate_eligible
        }
    }
