const mongoose = require("mongoose");
const Course = require("../models/course");

const DB_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/sensiq";

const courses = [
    {
        title: "Introduction to Computer",
        description: "Learn the fundamentals of using a computer — from understanding hardware components to navigating the operating system, managing files and folders, and using essential applications like text editors and calculators.",
        icon: "fa-desktop",
        category: ["deaf", "mute", "visually_impaired", "deaf_mute", "mute_visually_impaired"],
        difficulty: "beginner",
        estimatedDuration: "2 hours",
        lessons: [
            {
                title: "What is a Computer?",
                content: "A computer is an electronic device that processes data according to instructions. It consists of hardware (physical components) and software (programs). The main hardware components include:\n\n• **CPU (Central Processing Unit)** — the brain of the computer that executes instructions\n• **RAM (Random Access Memory)** — temporary memory for running programs\n• **Hard Drive / SSD** — permanent storage for files and programs\n• **Monitor** — displays visual output\n• **Keyboard & Mouse** — input devices for interacting with the computer\n\nComputers are used everywhere — schools, offices, hospitals, and homes. Learning to use one opens doors to education, employment, and communication.",
                videoUrl: "https://app.heygen.com/embeds/126ac65139e146aab662c32fd41a1ba5",
                signLanguageVideoUrl: "/videos/computer-sign-language.mp4",
                order: 1,
                duration: "15 min",
            },
            {
                title: "Turning On and Shutting Down",
                content: "To start using a computer:\n\n1. Press the **power button** on the CPU or laptop\n2. Wait for the operating system (like Windows) to load\n3. You will see the **desktop** — your main workspace\n\nTo safely shut down:\n1. Click the **Start menu** (bottom-left corner)\n2. Click **Power** → **Shut down**\n3. Wait for the computer to fully turn off\n\n⚠️ **Important:** Never force-shut a computer by holding the power button unless it is frozen. This can damage files.",
                videoUrl: "https://app.heygen.com/embeds/126ac65139e146aab662c32fd41a1ba5",
                signLanguageVideoUrl: "/videos/computer-sign-language.mp4",
                order: 2,
                duration: "10 min",
            },
            {
                title: "Using the Keyboard and Mouse",
                content: "The **keyboard** has different sections:\n• **Letter keys** — A to Z for typing\n• **Number keys** — 0 to 9\n• **Function keys** — F1 to F12 for shortcuts\n• **Special keys** — Enter, Backspace, Shift, Ctrl, Alt, Space\n\nThe **mouse** has:\n• **Left click** — select items, open files\n• **Right click** — open context menus\n• **Scroll wheel** — scroll up and down a page\n• **Double click** — open applications or files\n\n**Keyboard shortcuts to remember:**\n• Ctrl + C = Copy\n• Ctrl + V = Paste\n• Ctrl + Z = Undo\n• Ctrl + S = Save\n• Alt + Tab = Switch between windows",
                videoUrl: "https://app.heygen.com/embeds/126ac65139e146aab662c32fd41a1ba5",
                signLanguageVideoUrl: "/videos/computer-sign-language.mp4",
                order: 3,
                duration: "15 min",
            },
            {
                title: "Managing Files and Folders",
                content: "Files are documents, images, videos, or programs stored on your computer. Folders help organize files.\n\n**Creating a folder:**\n1. Right-click on the Desktop\n2. Select **New** → **Folder**\n3. Type a name and press Enter\n\n**Moving files:**\n1. Right-click the file → **Cut**\n2. Open the destination folder\n3. Right-click → **Paste**\n\n**Deleting files:**\n1. Right-click the file → **Delete**\n2. Files go to the **Recycle Bin** first\n3. To permanently delete, empty the Recycle Bin\n\n**File types:**\n• .txt = Text file\n• .jpg/.png = Image\n• .mp4 = Video\n• .pdf = Document\n• .docx = Word document",
                videoUrl: "https://app.heygen.com/embeds/126ac65139e146aab662c32fd41a1ba5",
                signLanguageVideoUrl: "/videos/computer-sign-language.mp4",
                order: 4,
                duration: "20 min",
            },
        ],
    },
    {
        title: "Internet",
        description: "Understand how the internet works, learn to browse websites safely, use search engines effectively, create and manage email accounts, and stay safe from online threats.",
        icon: "fa-globe",
        category: ["deaf", "mute", "visually_impaired", "deaf_mute", "mute_visually_impaired"],
        difficulty: "beginner",
        estimatedDuration: "2 hours",
        lessons: [
            {
                title: "What is the Internet?",
                content: "The **Internet** is a global network of interconnected computers that allows people to share information, communicate, and access services.\n\n**Key concepts:**\n• **Website** — a collection of web pages (e.g., google.com)\n• **Web Browser** — software to access websites (Chrome, Firefox, Edge)\n• **URL** — the address of a website (e.g., https://www.google.com)\n• **Wi-Fi** — wireless internet connection\n• **Data** — the information sent and received online\n\n**What you can do online:**\n• Search for information\n• Send and receive emails\n• Watch videos and listen to music\n• Learn new skills through e-learning\n• Connect with people through social media\n• Shop for products and services",
                videoUrl: "https://share.descript.com/embed/Al4V6sPI4rE",
                signLanguageVideoUrl: "/videos/internet-sign-language.mp4",
                order: 1,
                duration: "15 min",
            },
            {
                title: "Using a Web Browser",
                content: "A web browser helps you access websites. The most common browsers are:\n• **Google Chrome** — most popular\n• **Mozilla Firefox** — privacy-focused\n• **Microsoft Edge** — comes with Windows\n\n**How to browse:**\n1. Open your web browser\n2. Click the **address bar** at the top\n3. Type a website URL (e.g., google.com) and press Enter\n4. The website loads on your screen\n\n**Browser features:**\n• **Tabs** — open multiple websites at once\n• **Bookmarks** — save websites you visit often\n• **History** — see websites you visited before\n• **Downloads** — view files you downloaded\n\n**Shortcuts:**\n• Ctrl + T = New tab\n• Ctrl + W = Close tab\n• Ctrl + L = Go to address bar\n• Ctrl + D = Bookmark this page",
                videoUrl: "https://share.descript.com/embed/Al4V6sPI4rE",
                signLanguageVideoUrl: "/videos/internet-sign-language.mp4",
                order: 2,
                duration: "15 min",
            },
            {
                title: "Search Engines and Effective Searching",
                content: "A **search engine** helps you find information on the internet. The most popular one is **Google** (google.com).\n\n**How to search effectively:**\n1. Go to google.com\n2. Type your question or keywords\n3. Press Enter or click the search button\n4. Browse the results and click the most relevant one\n\n**Tips for better searches:**\n• Use specific keywords: \"weather Mumbai today\" instead of \"what is the weather\"\n• Use quotes for exact phrases: \"Indian Sign Language\"\n• Add the word \"for beginners\" to find simpler content\n• Use Google Images to find pictures\n• Use Google Translate for language help\n\n**Be careful:** Not everything online is true. Check multiple sources and look for trusted websites (.gov, .edu, .org).",
                videoUrl: "https://share.descript.com/embed/Al4V6sPI4rE",
                signLanguageVideoUrl: "/videos/internet-sign-language.mp4",
                order: 3,
                duration: "15 min",
            },
            {
                title: "Email Basics",
                content: "**Email** (Electronic Mail) lets you send messages, files, and images over the internet.\n\n**Creating a Gmail account:**\n1. Go to gmail.com\n2. Click **Create account**\n3. Fill in your name, choose a username, and create a password\n4. Complete the verification steps\n\n**Sending an email:**\n1. Click **Compose**\n2. Enter the recipient's email address in **To**\n3. Add a **Subject** (brief topic)\n4. Type your message\n5. Click **Send**\n\n**Email etiquette:**\n• Use a clear subject line\n• Be polite and professional\n• Check for spelling errors before sending\n• Don't open emails from unknown senders\n• Never share passwords via email",
                videoUrl: "https://share.descript.com/embed/Al4V6sPI4rE",
                signLanguageVideoUrl: "/videos/internet-sign-language.mp4",
                order: 4,
                duration: "20 min",
            },
            {
                title: "Staying Safe Online",
                content: "The internet is powerful, but you must stay safe:\n\n**Password safety:**\n• Use strong passwords (mix letters, numbers, symbols)\n• Never share your password with anyone\n• Use different passwords for different accounts\n\n**Recognizing scams:**\n• Don't click links in suspicious emails\n• Never give personal info to unknown websites\n• If something sounds too good to be true, it probably is\n\n**Privacy tips:**\n• Don't share personal photos with strangers\n• Check privacy settings on social media\n• Log out of accounts on shared computers\n• Keep your software and browser updated\n\n**Cyberbullying:** If someone is being mean online, block them and tell a trusted adult or authority.",
                videoUrl: "https://share.descript.com/embed/Al4V6sPI4rE",
                signLanguageVideoUrl: "/videos/internet-sign-language.mp4",
                order: 5,
                duration: "15 min",
            },
        ],
    },
    {
        title: "Communication Skills",
        description: "Develop effective communication abilities including written communication, body language, active listening techniques, and digital communication tools suitable for all learners.",
        icon: "fa-comments",
        category: ["deaf", "mute", "visually_impaired", "deaf_mute", "mute_visually_impaired"],
        difficulty: "beginner",
        estimatedDuration: "1.5 hours",
        lessons: [
            {
                title: "What is Communication?",
                content: "**Communication** is the process of sharing information, thoughts, and feelings between people.\n\n**Types of communication:**\n• **Verbal** — speaking and listening\n• **Written** — emails, messages, documents\n• **Non-verbal** — body language, facial expressions, gestures\n• **Visual** — images, charts, sign language\n• **Digital** — video calls, chat apps, social media\n\n**Why communication matters:**\n• Helps you express your needs and ideas\n• Builds relationships and trust\n• Essential for education and employment\n• Helps resolve conflicts peacefully\n\n**For learners with sensory disabilities:**\n• Sign language is a complete language of its own\n• Speech-to-text tools help mute learners participate\n• Text-to-speech helps visually impaired learners receive information\n• Everyone deserves equal access to communication",
                videoUrl: "https://app.heygen.com/embeds/a54fb52f97a14536898bfde987f57032",
                signLanguageVideoUrl: "/videos/communication-sign-language.mp4",
                order: 1,
                duration: "15 min",
            },
            {
                title: "Written Communication",
                content: "Good writing helps you communicate clearly in emails, messages, and applications.\n\n**Tips for clear writing:**\n• Use simple words and short sentences\n• Organise your ideas before writing\n• Start with the main point\n• Use paragraphs to separate ideas\n• Proofread before sending\n\n**Common formats:**\n• **Email** — professional communication\n• **Letter** — formal requests or applications\n• **Report** — structured document with findings\n• **Message** — quick informal communication\n\n**Practice exercise:**\nTry writing a short email introducing yourself. Include:\n1. A greeting (Dear Sir/Madam)\n2. Your name and purpose\n3. A closing line (Thank you, Regards)\n\nGood written communication is especially important for deaf and mute learners who rely on text-based interaction.",
                videoUrl: "https://app.heygen.com/embeds/a54fb52f97a14536898bfde987f57032",
                signLanguageVideoUrl: "/videos/communication-sign-language.mp4",
                order: 2,
                duration: "20 min",
            },
            {
                title: "Body Language and Non-Verbal Cues",
                content: "Up to **70% of communication** is non-verbal — meaning it happens without words.\n\n**Key non-verbal signals:**\n• **Eye contact** — shows confidence and interest\n• **Facial expressions** — smile, frown, surprise\n• **Posture** — standing straight shows confidence\n• **Hand gestures** — emphasize points\n• **Personal space** — respect others' boundaries\n\n**In sign language:**\nFacial expressions are not just extra — they are part of the grammar. A raised eyebrow can change a statement into a question in ISL (Indian Sign Language).\n\n**Tips:**\n• Match your body language with your words\n• Pay attention to others' body language\n• Nod to show you are listening\n• Avoid crossing arms (can seem unfriendly)\n• Smile genuinely — it is understood in every culture",
                videoUrl: "https://app.heygen.com/embeds/a54fb52f97a14536898bfde987f57032",
                signLanguageVideoUrl: "/videos/communication-sign-language.mp4",
                order: 3,
                duration: "15 min",
            },
            {
                title: "Digital Communication Tools",
                content: "Modern technology provides many ways to communicate:\n\n**Video calls:**\n• Google Meet, Zoom, Microsoft Teams\n• Great for sign language users (visual)\n• Enable captions/subtitles when available\n\n**Messaging apps:**\n• WhatsApp, Telegram, Signal\n• Text-based — great for mute learners\n• Support images, voice notes, and files\n\n**Accessibility features in apps:**\n• Live captions in Google Meet\n• Voice typing in Google Docs\n• Screen readers for visually impaired users\n• Text magnification on phones and computers\n\n**Tips for digital communication:**\n• Keep messages clear and concise\n• Use emojis thoughtfully\n• Respond in a timely manner\n• Be respectful of different communication styles\n• Use accessibility features when needed",
                videoUrl: "https://app.heygen.com/embeds/a54fb52f97a14536898bfde987f57032",
                signLanguageVideoUrl: "/videos/communication-sign-language.mp4",
                order: 4,
                duration: "15 min",
            },
        ],
    },
    {
        title: "Resume Building",
        description: "Learn how to create a professional resume that highlights your skills, education, and experience. Includes templates and tips specifically designed for differently-abled job seekers.",
        icon: "fa-file-alt",
        category: ["deaf", "mute", "visually_impaired", "deaf_mute", "mute_visually_impaired"],
        difficulty: "intermediate",
        estimatedDuration: "1.5 hours",
        lessons: [
            {
                title: "What is a Resume?",
                content: "A **resume** (also called a CV — Curriculum Vitae) is a document that summarizes your education, skills, experience, and achievements.\n\n**Why you need a resume:**\n• Required for job applications\n• First impression to employers\n• Shows your qualifications at a glance\n• Helps you stand out from other candidates\n\n**Resume sections:**\n1. **Contact Information** — name, phone, email, city\n2. **Objective** — a brief statement about your career goal\n3. **Education** — schools, degrees, certifications\n4. **Skills** — technical and soft skills\n5. **Experience** — jobs, internships, volunteering\n6. **Projects** — relevant projects you have completed\n7. **Achievements** — awards, recognitions\n\n**For differently-abled candidates:**\n• You are NOT required to disclose your disability\n• Focus on your abilities and skills\n• Mention assistive technology skills as strengths",
                videoUrl: "https://app.heygen.com/embeds/b9470fef905d4637b24e1171956e30c0",
                signLanguageVideoUrl: "/videos/resume-sign-language.mp4",
                order: 1,
                duration: "15 min",
            },
            {
                title: "Writing a Strong Objective",
                content: "The **objective** (or summary) appears at the top of your resume, right after your name and contact info.\n\n**A good objective should:**\n• Be 2-3 sentences long\n• State the role you are applying for\n• Highlight your key strengths\n• Show enthusiasm\n\n**Examples:**\n\n*For a fresh graduate:*\n\"Motivated Computer Engineering graduate with strong skills in web development and accessibility design. Seeking an entry-level software developer role to contribute to inclusive technology projects.\"\n\n*For an experienced worker:*\n\"Detail-oriented data entry professional with 2 years of experience and excellent accuracy. Looking for an opportunity to apply my skills in an inclusive work environment.\"\n\n**Tips:**\n• Customize the objective for each job\n• Avoid generic statements\n• Use action words: motivated, skilled, experienced\n• Keep it focused and confident",
                videoUrl: "https://app.heygen.com/embeds/b9470fef905d4637b24e1171956e30c0",
                signLanguageVideoUrl: "/videos/resume-sign-language.mp4",
                order: 2,
                duration: "15 min",
            },
            {
                title: "Listing Skills Effectively",
                content: "The skills section helps employers quickly see what you can do.\n\n**Types of skills:**\n\n**Technical skills:**\n• Computer proficiency (MS Office, typing)\n• Programming (Python, HTML, JavaScript)\n• Data entry, documentation\n• Social media management\n• Graphic design\n\n**Soft skills:**\n• Problem solving, critical thinking\n• Team collaboration\n• Time management\n• Adaptability, attention to detail\n• Written communication\n\n**Accessibility-related skills (strengths!):**\n• Proficient in Indian Sign Language (ISL)\n• Experience with assistive technologies\n• Knowledge of accessibility standards (WCAG)\n• Screen reader navigation\n• Text-to-speech and speech-to-text tools\n\n**Tips:**\n• List 6-10 skills maximum\n• Put your strongest skills first\n• Match skills to the job description\n• Be honest — don't exaggerate",
                videoUrl: "https://app.heygen.com/embeds/b9470fef905d4637b24e1171956e30c0",
                signLanguageVideoUrl: "/videos/resume-sign-language.mp4",
                order: 3,
                duration: "15 min",
            },
            {
                title: "Resume Formatting and Templates",
                content: "A clean, well-formatted resume is easier to read and looks professional.\n\n**Formatting rules:**\n• Use a clean font: Arial, Calibri, or Times New Roman\n• Font size: 11-12pt for body, 14-16pt for name\n• Keep it to **1 page** (for freshers) or 2 pages (experienced)\n• Use consistent spacing and alignment\n• Use bullet points, not paragraphs\n• Save as PDF before sending\n\n**Resume template structure:**\n```\n┌──────────────────────────┐\n│ YOUR FULL NAME           │\n│ Phone | Email | City     │\n├──────────────────────────┤\n│ OBJECTIVE                │\n│ Brief career statement   │\n├──────────────────────────┤\n│ EDUCATION                │\n│ Degree — College — Year  │\n├──────────────────────────┤\n│ SKILLS                   │\n│ • Skill 1  • Skill 2    │\n├──────────────────────────┤\n│ EXPERIENCE / PROJECTS    │\n│ Role — Company — Dates   │\n├──────────────────────────┤\n│ ACHIEVEMENTS             │\n│ Awards, certifications   │\n└──────────────────────────┘\n```\n\n**Common mistakes to avoid:**\n• Spelling and grammar errors\n• Including personal photos (not needed in India)\n• Using unprofessional email addresses\n• Making it too long or too cluttered",
                videoUrl: "https://app.heygen.com/embeds/b9470fef905d4637b24e1171956e30c0",
                signLanguageVideoUrl: "/videos/resume-sign-language.mp4",
                order: 4,
                duration: "20 min",
            },
        ],
    },
    {
        title: "Introduction to AI",
        description: "Explore the fascinating world of Artificial Intelligence. Learn what AI is, how it works, its real-world applications, and its role in making technology more accessible for everyone.",
        icon: "fa-robot",
        category: ["deaf", "mute", "visually_impaired", "deaf_mute", "mute_visually_impaired"],
        difficulty: "intermediate",
        estimatedDuration: "2 hours",
        lessons: [
            {
                title: "What is Artificial Intelligence?",
                content: "**Artificial Intelligence (AI)** is the ability of machines or software to perform tasks that normally require human intelligence.\n\n**Examples of AI in daily life:**\n• **Google Search** — understands what you're looking for\n• **Siri / Google Assistant** — responds to voice commands\n• **YouTube recommendations** — suggests videos you might like\n• **Spam filters** — keeps junk emails out of your inbox\n• **Auto-correct** — fixes typing mistakes\n\n**Types of AI:**\n• **Narrow AI** — designed for one specific task (e.g., playing chess)\n• **General AI** — can do any intellectual task a human can (still being researched)\n\n**AI is NOT:**\n• A robot that looks human\n• Something that will replace all humans\n• Dangerous by itself — it depends on how we use it\n\n**Fun fact:** The term \"Artificial Intelligence\" was coined in **1956** by John McCarthy at Dartmouth College.",
                videoUrl: "https://share.descript.com/embed/ovD3PIk4eql",
                signLanguageVideoUrl: "/videos/ai-sign-language.mp4",
                order: 1,
                duration: "15 min",
            },
            {
                title: "How AI Works — The Basics",
                content: "AI works by learning from **data** — lots and lots of data.\n\n**Three key concepts:**\n\n**1. Machine Learning (ML):**\nInstead of being programmed with exact rules, the computer learns patterns from data.\nExample: Show an AI 10,000 photos of cats and dogs. After learning, it can identify new photos it has never seen.\n\n**2. Training and Testing:**\n• **Training** — feeding data to the AI so it can learn\n• **Testing** — giving it new data to see if it learned correctly\nLike studying for an exam (training) and then taking the exam (testing).\n\n**3. Neural Networks:**\nInspired by the human brain, neural networks are layers of connected nodes that process information.\n\n**Simple analogy:**\nImagine teaching a child to recognize fruits:\n• You show them apples, bananas, oranges many times\n• They learn the shape, colour, and size patterns\n• Eventually, they can identify a fruit they haven't seen before\n\nAI works the same way, but with mathematical patterns instead of human memory.",
                videoUrl: "https://share.descript.com/embed/ovD3PIk4eql",
                signLanguageVideoUrl: "/videos/ai-sign-language.mp4",
                order: 2,
                duration: "20 min",
            },
            {
                title: "AI in Accessibility",
                content: "AI is making technology more **accessible** for people with disabilities:\n\n**For deaf and hard-of-hearing users:**\n• **Auto-captions** — YouTube, Google Meet automatically generate subtitles\n• **Sign language recognition** — AI can translate sign language to text\n• **Sound notifications** — AI detects sounds (doorbell, alarm) and sends visual alerts\n\n**For mute users:**\n• **Text-to-speech** — AI converts typed text into natural-sounding speech\n• **AAC devices** — Augmentative and Alternative Communication tools powered by AI\n• **Predictive text** — AI suggests words to type faster\n\n**For visually impaired users:**\n• **Screen readers** — AI reads screen content aloud (JAWS, NVDA)\n• **Image description** — AI describes photos (e.g., \"A dog playing in a park\")\n• **Navigation apps** — AI-powered GPS with voice directions\n• **OCR (Optical Character Recognition)** — AI reads text from images\n\n**SensiQ uses AI concepts:**\n• Speech-to-text for mute learners\n• Text-to-speech for visually impaired learners\n• Text-to-sign language conversion\n\nAI is a powerful tool for inclusion!",
                videoUrl: "https://share.descript.com/embed/ovD3PIk4eql",
                signLanguageVideoUrl: "/videos/ai-sign-language.mp4",
                order: 3,
                duration: "20 min",
            },
            {
                title: "Real-World AI Applications",
                content: "AI is everywhere around us:\n\n**Healthcare:**\n• AI detects diseases from X-rays and scans\n• Drug discovery is faster with AI\n• AI chatbots provide health advice\n\n**Education:**\n• Personalized learning paths (like SensiQ!)\n• Automated grading systems\n• Language translation for global learning\n\n**Transportation:**\n• Self-driving cars (Tesla, Waymo)\n• Traffic prediction (Google Maps)\n• Ride-sharing optimization (Ola, Uber)\n\n**Agriculture:**\n• AI drones monitor crop health\n• Weather prediction for farmers\n• Soil analysis for better harvests\n\n**Entertainment:**\n• Netflix/YouTube recommendations\n• AI-generated art and music\n• Video game opponents that adapt to your skill level\n\n**Careers in AI:**\n• Data Scientist\n• Machine Learning Engineer\n• AI Research Scientist\n• Robotics Engineer\n• NLP (Natural Language Processing) Specialist\n\nAI is one of the fastest-growing fields in technology. Learning about it now gives you an advantage for the future!",
                videoUrl: "https://share.descript.com/embed/ovD3PIk4eql",
                signLanguageVideoUrl: "/videos/ai-sign-language.mp4",
                order: 4,
                duration: "20 min",
            },
            {
                title: "Ethics and Future of AI",
                content: "As AI becomes more powerful, we must use it **responsibly**.\n\n**Ethical concerns:**\n\n**1. Bias:**\nAI learns from data — if the data is biased, the AI will be biased too.\nExample: A hiring AI trained mostly on male resumes might unfairly reject female candidates.\n\n**2. Privacy:**\nAI systems collect a lot of personal data. Companies must protect this data.\n\n**3. Job displacement:**\nSome jobs will be automated. But new jobs will also be created.\nExample: ATMs replaced some bank tellers, but created IT and maintenance jobs.\n\n**4. Transparency:**\nPeople should know when they are interacting with AI.\n\n**5. Accessibility:**\nAI should be designed to include everyone, including people with disabilities.\n\n**The future of AI:**\n• More natural conversations with AI assistants\n• Better healthcare diagnostics\n• Smarter accessibility tools\n• AI-powered personalized education\n• Breakthroughs in science and climate change\n\n**Remember:** AI is a tool. Its impact depends on the people who build and use it. That includes you!",
                videoUrl: "https://share.descript.com/embed/ovD3PIk4eql",
                signLanguageVideoUrl: "/videos/ai-sign-language.mp4",
                order: 5,
                duration: "15 min",
            },
        ],
    },
];

async function seedCourses() {
    /* When called from app.js, connection is already open — just insert */
    const isStandalone = require.main === module;
    try {
        if (isStandalone) {
            await mongoose.connect(DB_URL);
            console.log("Connected to MongoDB for seeding.");
        }

        console.log("Clearing existing courses...");
        await Course.deleteMany({});

        await Course.insertMany(courses);
        console.log(`Seeded ${courses.length} courses successfully.`);
        if (isStandalone) {
            await mongoose.connection.close();
            console.log("Database connection closed.");
        }
    } catch (error) {
        console.error("Seeding error:", error.message);
        if (isStandalone) process.exit(1);
    }
}

if (require.main === module) {
    seedCourses();
}

module.exports = seedCourses;
