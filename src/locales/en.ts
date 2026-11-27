import type { Locale } from './fr.ts'

export const en: Locale = {
  meta: {
    title: 'PIXEL RESISTANCE — The resilient digital village',
    skip: 'Skip to content',
    lang: 'Language',
  },
  common: {
    close: 'Close',
    back: 'Back',
    next: 'Next',
    continue: 'Continue',
    locked: 'Locked',
    xp: 'XP',
    coins: 'coins',
    level: 'Lv.',
    cancel: 'Cancel',
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    menu: 'Menu',
    backToSite: 'Discover NIRD WORLD',
    new: 'New',
  },
  nav: {
    label: 'Game navigation',
    village: 'Village',
    missions: 'Missions',
    enemies: 'Enemies',
    workshop: 'Workshop',
    hq: 'HQ',
  },
  levels: {
    '1': 'Recruit',
    '2': 'Scout',
    '3': 'Tinkerer',
    '4': 'Free-software fan',
    '5': 'Strategist',
    '6': 'Village legend',
  },
  axes: {
    hardware: 'Hardware',
    software: 'Software',
    data: 'Data',
    people: 'People',
    openness: 'Openness',
  },
  menu: {
    tagline: 'The resilient digital village',
    story:
      'A digital empire has taken over the educational village. Schools are buried under licences, locked into closed ecosystems, watching their data drift away and throwing out computers that still work. You, a member of the Resistance, will help the village take back control of its digital life.',
    skipStory: 'Show the full text',
    start: 'New game',
    continue: 'Continue',
    howto: 'How to play',
    about: 'The Resistance',
    progress: '{{done}}/{{total}} missions · lv. {{level}}',
    confirmTitle: 'Start over?',
    confirmText: 'Your current progress (missions, XP, coins, achievements) will be erased. This cannot be undone.',
    confirmYes: 'Yes, new game',
    keys: '↑ ↓ to choose · Enter to confirm',
  },
  howto: {
    title: 'How to play',
    items: [
      'Explore the village: move your character with the arrow keys (or W A S D), or click a building directly.',
      'Walk into a building to enter it, or into a villager to talk. On mobile, use the on-screen D-pad.',
      'Missions are played at the school. Every choice comes with an explanation: there is rarely a single right answer, but some choices are sounder than others.',
      'You earn XP and coins by finishing missions, reading enemy files, mastering workshop modules and meeting villagers.',
      'Replaying a mission only pays if you beat your best score: just the difference is added.',
      'Stuck on a question? A mentor hint (5 coins) rules out one weak option. Careful: spent coins count against your final score.',
      'Your game is saved automatically in this browser.',
    ],
  },
  about: {
    title: 'The Resistance',
    paragraphs: [
      'PIXEL RESISTANCE is an educational game made for the Nuit de l’Info 2025 (the “On veut du gros pixel!” challenge, set by the IUT du Littoral Côte d’Opale computer science department) on the national theme: “The Resilient Digital Village: how can schools stand up to Big Tech?”.',
      'It draws on real initiatives such as NIRD (an inclusive, responsible and sustainable approach to digital tech in French schools): reusing hardware, choosing free software, protecting pupils’ data and training staff.',
      'The game’s “empire” is a caricature: many proprietary services are reliable and useful. The game aims to show the trade-offs — cost, dependency, compatibility, training — so everyone can decide with full knowledge.',
      'The code is free software (MIT licence). All graphics and sounds are original, drawn in code.',
    ],
  },
  hud: {
    label: 'Player status',
    toNext: '{{xp}} XP to level {{level}}',
    max: 'Maximum level reached',
    missions: 'Missions',
  },
  toasts: {
    achievement: 'Achievement unlocked!',
    level: 'Level {{level}}!',
  },
  village: {
    title: 'The village',
    intro: 'The digital village, still in the shadow of the Empire’s tower. Every mission you complete frees a new place.',
    mapLabel: 'Village map. Use the arrow keys to move.',
    mapHint: 'Click the map, then use the arrow keys · Walk into a building to enter',
    pad: { up: 'Up', down: 'Down', left: 'Left', right: 'Right' },
    places: 'Places',
    lockedBy: 'Complete the “{{mission}}” mission to unlock this place.',
    lockedAll: 'Complete all five missions to free the tower.',
    visited: 'Visited',
    talk: 'Talk',
    bump: 'A tree blocks the way.',
    water: 'The pond is too deep!',
    intro1: 'Welcome, recruit! I’m Karim, the school’s digital lead. The Empire controls our schools: overpriced licences, data drifting away, computers thrown out too soon.',
    intro2: 'Move with the arrow keys or click a building. Walk into a villager to chat: everyone has a tip.',
    intro3: 'Start with the school, in the middle: your first mission is waiting there. Good luck!',
  },
  locations: {
    school: {
      name: 'Central School',
      text: 'The heart of the village. Teachers are preparing the resistance here: this is where missions are played, from an ageing computer room to the digital strategy of the whole village.',
      cta: 'See the missions',
    },
    hq: {
      name: 'Resistance HQ',
      text: 'The secret cellar where the Resistance keeps its records: level, statistics, unlocked achievements. You’ll also find the button to start a new game.',
      cta: 'Enter HQ',
    },
    library: {
      name: 'Digital Library',
      text: 'The Empire’s archives, stolen by the Resistance. Each file describes a real threat to schools, with its consequences, its nuances and possible counter-moves.',
      cta: 'Read the enemy files',
    },
    workshop: {
      name: 'Computer Workshop',
      text: 'Workbench, screwdrivers and USB install sticks: this is where you learn practical solutions. Linux, LibreOffice, open platforms, reuse, open formats, accessibility.',
      cta: 'Enter the workshop',
    },
    server: {
      name: 'The Little Server',
      text: 'A human-sized server room. Hosting some services close to home (by the school, the local authority or national education platforms) means knowing where pupils’ data lives. It also takes skills and serious backups.',
      cta: '“Privacy-friendly services” module',
    },
    repair: {
      name: 'Repair Café',
      text: 'Every Saturday, volunteers, pupils and parents fix things together. A computer that lasts longer means less waste and less spending: most of a computer’s environmental impact comes from manufacturing it.',
      cta: '“Refurbishing hardware” module',
    },
    tower: {
      name: 'The Empire’s Tower',
      text: 'The tower from which the Empire watched the village. With all five missions done, its gates are open: the village has regained its digital independence.',
      cta: 'See the victory summary',
    },
  },
  npcs: {
    teacher: {
      name: 'Mrs Lefèvre',
      role: 'Technology teacher',
      lines: [
        'My pupils know how to use software, but do they know how a computer works? Installing a free operating system in class is a lesson in itself.',
        'Switching tools scares me a little, I admit. What helps: trying it first on one project, with a colleague who already knows it.',
        'My tip: an open format for shared documents. My pupils can open them at home, whatever computer they have.',
      ],
    },
    tech: {
      name: 'Karim',
      role: 'Digital lead',
      lines: [
        'Before changing anything, I take stock: which machines, which software, which uses. You can’t resist blindfolded.',
        'An old PC with an SSD and a lightweight Linux often runs for several more years. I always test on a few machines before rolling out.',
        'Free software isn’t “effortless”: it needs updates, documentation and training. But those skills stay with us.',
      ],
    },
    student: {
      name: 'Lou',
      role: 'Year 9 pupil, computer club',
      lines: [
        'At the club, we brought six old laptops back to life! The hardest part was wiping the old data properly.',
        'We didn’t have a computer at home. The refurbished one the school lent me changed everything for my homework.',
        'I learned that a “free” app can be paid for with our data. Now I check who I’m giving my details to.',
      ],
    },
    grandpa: {
      name: 'Grandpa Jo',
      role: 'Repair café volunteer',
      lines: [
        'In my day, we fixed everything. Computers are no different: often it’s just a tired disk or a worn-out battery.',
        'The repair café is also a place where we learn together. The youngsters teach me Linux, I teach them soldering!',
        'Throwing away a device that works means throwing away the metals, energy and labour it took to make it.',
      ],
    },
  },
  enemies: {
    title: 'Enemy files',
    intro:
      'The Empire’s archives. Every threat is real, but none is inevitable, and not all of them are only about tech giants: the point is to understand the trade-offs.',
    discovered: '{{count}}/{{total}} files read',
    danger: 'Threat',
    sections: {
      description: 'What it is',
      example: 'Real-world example',
      consequences: 'Consequences for schools',
      alternatives: 'Possible counter-moves',
      nuance: 'Nuance',
      counters: 'Helpful workshop modules',
    },
    unread: 'File not read yet',
    lockin: {
      name: 'The Locksmith',
      threat: 'Vendor lock-in',
      description:
        'When tools, accounts and formats are all tied to a single provider, leaving becomes very costly. It isn’t always intentional: each convenient choice, taken on its own, tightens the bond a little more.',
      example:
        'A secondary school uses one vendor’s email, storage, documents and calendar. The day prices go up, migrating would mean converting thousands of files, recreating accounts and retraining everyone.',
      consequences: [
        'Little bargaining power against price rises or changed terms.',
        'Teaching projects dependent on one company’s strategic decisions.',
        'Staff skills tied to a product rather than to transferable concepts.',
      ],
      alternatives: [
        'Prefer open formats and tools that can export your data.',
        'Spread services across several providers, including free-software ones.',
        'Plan an “exit door” from day one: how would we get our data back if we switched?',
      ],
      nuance:
        'An integrated ecosystem is often easy to manage and well documented. The problem isn’t using a provider — it’s no longer being able to leave.',
    },
    licenses: {
      name: 'The Toll Collector',
      threat: 'Expensive proprietary licences',
      description:
        'Much software is paid for per device or per user, often as a subscription. The cost comes back every year and grows with the number of pupils and teachers.',
      example:
        'A high school renews office and photo-editing licences for every computer room each year, although part of that use (word processing, spreadsheets, drawing) is covered by free software.',
      consequences: [
        'Budget diverted from other projects (trips, equipment, training).',
        'Inequality: pupils don’t always have the software at home.',
        'Risk of disruption if a licence expires or isn’t renewed.',
      ],
      alternatives: [
        'Review actual use before every renewal.',
        'Adopt free software for everyday use (LibreOffice, GIMP, Inkscape, Krita…).',
        'Keep targeted licences where a specific need isn’t covered.',
      ],
      nuance:
        'Free software costs nothing to install, but not nothing to deploy: installation, support and training take time. Compare it with the total cost of licences, not with zero.',
    },
    data: {
      name: 'The Data Hoover',
      threat: 'Data sovereignty and privacy',
      description:
        'Pupils are minors and their data (grades, work, behaviour, voice, images) is sensitive. Some services, especially “free” ones, fund themselves by collecting or exploiting that data.',
      example:
        'A very popular quiz app asks for an account per pupil with name, class and email address. Its terms of use allow data to be shared with commercial partners.',
      consequences: [
        'Possible breach of the GDPR, for which the school is responsible.',
        'Pupil profiles built without their knowledge, sometimes outside the European Union.',
        'Loss of trust from families.',
      ],
      alternatives: [
        'Check with the education authority’s data protection officer before adopting a service.',
        'Prefer services provided by the national education system (in France, apps.education.fr and school digital workspaces) or hosted locally.',
        'Minimise: pseudonyms, no unnecessary data, short retention periods.',
      ],
      nuance:
        'Paid services aren’t automatically safer, and major providers sometimes offer contracts tailored to education. What matters is the contract, the hosting and the data actually collected.',
    },
    obsolescence: {
      name: 'The Hourglass',
      threat: 'Planned and software obsolescence',
      description:
        'A computer can work perfectly and still be “condemned”: no more operating system updates, ever-hungrier software, parts that can’t be replaced.',
      example:
        'Since 14 October 2025, Windows 10 no longer receives free security updates. Many PCs that still work aren’t compatible with Windows 11 (processor too old, no TPM 2.0 chip).',
      consequences: [
        'Early replacements weighing on the school’s or local authority’s budget.',
        'Electronic waste and environmental impact, most of which comes from manufacturing.',
        'Unpatched machines exposed to security flaws if they stay in use.',
      ],
      alternatives: [
        'Install an operating system that is still maintained and suits the hardware (a lightweight Linux distribution).',
        'Upgrade the hardware: SSD, memory, battery.',
        'Give machines a second life: loans to families, spare workstations, parts.',
      ],
      nuance:
        'Not updating a system is a risk too: keeping a PC on an unmaintained system on the school network is no solution. Extend its life, yes — but safely.',
    },
    cloud: {
      name: 'The Cloud King',
      threat: 'Dependence on cloud platforms',
      description:
        'When all activity goes through online services, the school depends on their availability, their prices, their terms and the laws of the country where they are hosted.',
      example:
        'On the day a major provider goes down, nobody can reach lessons, homework or email. Elsewhere, a free service starts charging and the school has to migrate in a hurry.',
      consequences: [
        'Teaching at the mercy of an outage or a change in commercial policy.',
        'Data subject to extraterritorial laws (such as the US CLOUD Act).',
        'Difficulty getting data back when leaving.',
      ],
      alternatives: [
        'Choose services hosted in Europe, ideally by public or shared providers.',
        'Keep local, exportable copies of important content.',
        'Use self-hostable free software (Nextcloud, Moodle, BigBlueButton…).',
      ],
      nuance:
        'The cloud has real benefits: no server to maintain, access anywhere, managed backups. Self-hosting takes skills. The goal is to keep the choice and the control.',
    },
    interop: {
      name: 'The Format Wall',
      threat: 'Lack of interoperability',
      description:
        'Tools that don’t talk to each other, files that only open in one specific program: everyone stays stuck in their bubble, and switching tools means losing documents.',
      example:
        'A pupil hands in homework in a format that only a paid program opens correctly. At home, the family doesn’t have that program: the layout is broken.',
      consequences: [
        'Inequality between families depending on their equipment.',
        'School archives that are hard to read ten years later.',
        'Conversion costs and lost information during migrations.',
      ],
      alternatives: [
        'Adopt open, standardised formats: ODF (ISO/IEC 26300), PDF, PNG, HTML, CSV.',
        'Choose tools that respect standards and allow export.',
        'Export to PDF to share, keep the open format to edit.',
      ],
      nuance:
        'Open formats don’t solve everything: a complex document’s layout can vary between programs. Testing key documents when switching tools avoids nasty surprises.',
    },
  },
  workshop: {
    title: 'Resistance Workshop',
    intro: 'Seven modules to go from theory to action. Read each sheet, then answer the check question to master the module.',
    mastered: '{{count}}/{{total}} modules mastered',
    masteredBadge: 'Mastered',
    open: 'Open module',
    sections: {
      what: 'In short',
      benefits: 'What it changes for the school',
      watchouts: 'Plan for',
      firstStep: 'First step',
    },
    check: 'Check question',
    right: 'Correct! Module mastered.',
    wrong: 'Not quite. Reread the sheet and try again.',
    retry: 'Try again',
  },
  modules: {
    linux: {
      title: 'Linux and free operating systems',
      tagline: 'A maintained, free system that brings machines back to life',
      what: 'Linux is a free operating system that comes in “distributions”: Linux Mint or Xubuntu for general use, PrimTux for primary schools, Emmabuntüs for reuse. They receive security updates and often run well on older hardware.',
      benefits: [
        'Extends the life of PCs that can’t run the latest Windows versions.',
        'No per-device licence to pay, including for computers lent to families.',
        'Lets you teach how a system works, not just how to use it.',
      ],
      watchouts: [
        'Check that the teaching software in use works (or has a web or free version).',
        'Plan teacher training and simple documentation.',
        'If needed, keep a few machines on another system for specific uses.',
      ],
      firstStep: 'Test a distribution on two or three pilot machines with a volunteer teacher.',
      quiz: {
        question: 'What is the best way to switch a computer room to Linux?',
        options: [
          'Reinstall everything over a weekend, without warning, to save time.',
          'Start with a few pilot machines, check the software in use and train the teachers.',
          'Wait until every computer breaks down, then switch all at once.',
        ],
        explain: 'A pilot reveals incompatibilities and reassures staff before rolling out.',
      },
    },
    libreoffice: {
      title: 'LibreOffice and free office software',
      tagline: 'Word processing, spreadsheets and slides with no licence',
      what: 'LibreOffice is a free office suite (Writer, Calc, Impress, Draw…) developed by a foundation. It runs on Windows, macOS and Linux, uses the open ODF format and can open and save common formats such as .docx or .xlsx.',
      benefits: [
        'The same software at school and at home, free, for every family.',
        'Standardised ODF format: documents remain readable over time.',
        'Works without an online account or a connection.',
      ],
      watchouts: [
        'The layout of complex documents may vary slightly with other suites.',
        'Macros written for another program may need rewriting.',
        'Plan a short introduction: the interface is a little different.',
      ],
      firstStep: 'Install LibreOffice on every machine alongside existing software, and use it for new documents.',
      quiz: {
        question: 'A colleague must send an editable document to families who use different software. What do you advise?',
        options: [
          'The format of their paid program — it’s the most common.',
          'A screenshot of the document.',
          'The open ODF format (or a PDF if the document doesn’t need editing).',
        ],
        explain: 'An open format opens in many programs, including free ones: nobody has to buy anything.',
      },
    },
    learning: {
      title: 'Open-source learning platforms',
      tagline: 'Online courses without giving away pupils’ data',
      what: 'Moodle is a free learning platform used worldwide; the French national education system offers Éléa, built on Moodle. Interactive content can be created with H5P, and apps.education.fr provides staff with video conferencing, storage and video hosting.',
      benefits: [
        'Hosting controlled by the institution, with no commercial use of data.',
        'Content that can be reused and shared between teachers and schools.',
        'No dependence on a company’s free offer that may change.',
      ],
      watchouts: [
        'A platform needs hosting, updates and support.',
        'Prefer instances already provided (education authority, local council) over building everything alone.',
        'Train teachers to design courses, not just to use the tool.',
      ],
      firstStep: 'Create a first course on the platform provided by your education authority and share it with a colleague.',
      quiz: {
        question: 'Why use an institutional platform rather than any free app?',
        options: [
          'Because the hosting and use of pupils’ data are governed by the institution.',
          'Because institutional platforms always look nicer.',
          'Because using any other website in class is forbidden.',
        ],
        explain: 'The main issue is control over data and long-term reliability, not looks or a blanket ban.',
      },
    },
    refurbish: {
      title: 'Refurbishing hardware',
      tagline: 'Repair, upgrade, redistribute',
      what: 'Refurbishing means testing a device, securely wiping its data, replacing worn parts and installing a suitable system. Charities and social-economy businesses specialise in it.',
      benefits: [
        'Less electronic waste: most of a computer’s footprint comes from manufacturing.',
        'Equipping pupils and families who don’t have a computer.',
        'A hands-on project for pupils: diagnosis, assembly, documentation.',
      ],
      watchouts: [
        'Really wipe old data (with a dedicated tool, not just deleting files).',
        'Respect electrical safety and use proper recycling for what can’t be repaired.',
        'Decide who provides support when a distributed device breaks down.',
      ],
      firstStep: 'Run a diagnosis workshop with the computer club on a few donated machines.',
      quiz: {
        question: 'An old laptop boots very slowly. Which upgrade usually has the biggest effect?',
        options: [
          'Replacing the keyboard.',
          'Replacing the hard drive with an SSD.',
          'Installing a “cleaner” program found online.',
        ],
        explain: 'The mechanical hard drive is often the bottleneck; an SSD transforms the machine at modest cost.',
      },
    },
    privacy: {
      title: 'Privacy-friendly services',
      tagline: 'Knowing where data lives, and who can access it',
      what: 'Alternatives exist for most uses: Nextcloud for storage, BigBlueButton or Jitsi for video calls, PeerTube for video. In France, many are offered to education staff through apps.education.fr, or by non-profits such as Framasoft.',
      benefits: [
        'Data hosted in France or Europe, by identified providers.',
        'GDPR compliance easier to demonstrate.',
        'Stronger trust from families.',
      ],
      watchouts: [
        'Some tools have fewer features: check they cover real needs.',
        'A self-hosted service must be backed up and updated.',
        'Involve the data protection officer from the start.',
      ],
      firstStep: 'List the online services used with pupils and check, for each one, where the data goes.',
      quiz: {
        question: 'What should you ask first before using an online service with pupils?',
        options: [
          'Is the logo nice?',
          'How many people already use it?',
          'What data is collected, where is it hosted and what is it used for?',
        ],
        explain: 'Popularity guarantees nothing: what counts is collection, hosting and purpose.',
      },
    },
    standards: {
      title: 'Open standards and interoperability',
      tagline: 'Files that outlive software',
      what: 'An open standard is a public specification anyone can implement: ODF for office documents, PDF for sharing, PNG and SVG for images, HTML for the web, CSV for data. Interoperability is the ability of tools to work together thanks to these standards.',
      benefits: [
        'Switch tools without losing your documents.',
        'Archives that remain readable over time.',
        'Equality between pupils, whatever software they have.',
      ],
      watchouts: [
        'Set simple, shared rules (which format for what).',
        'Test important documents when converting.',
        'Explain the why to staff, or old habits come back.',
      ],
      firstStep: 'Adopt a school-wide rule: ODF to edit, PDF to share.',
      quiz: {
        question: 'What is an open standard?',
        options: [
          'A public specification that any software can implement.',
          'A free format reserved for a single vendor.',
          'A program installed on every computer in a country.',
        ],
        explain: 'What matters is that the specification is public and can be implemented by anyone, without depending on one vendor.',
      },
    },
    inclusion: {
      title: 'Digital inclusion and accessibility',
      tagline: 'Digital tools for every pupil, not just those already equipped',
      what: 'Digital inclusion means giving everyone access to digital tools and the ability to use them: hardware, connection, skills. Accessibility means tools usable by all, including people with disabilities (free screen readers such as NVDA or Orca, keyboard navigation, contrast, subtitles).',
      benefits: [
        'No pupil left out of digital homework.',
        'Accessible tools benefit everyone (clarity, readability, keyboard use).',
        'Families gain independence too.',
      ],
      watchouts: [
        'Check accessibility when choosing a tool (in France, the RGAA is the reference for public services).',
        'Support families, don’t just hand them a device.',
        'Don’t assume every pupil has a computer or a connection at home.',
      ],
      firstStep: 'Discreetly identify pupils without equipment and offer them a refurbished loan device.',
      quiz: {
        question: 'A new visually impaired pupil arrives. When should the accessibility of digital tools be addressed?',
        options: [
          'Later, when there’s time to redo everything.',
          'Now, and ideally whenever a tool is chosen.',
          'Never: adapting tools is the family’s job.',
        ],
        explain: 'Thinking about accessibility from the start costs far less than fixing it afterwards, and benefits everyone.',
      },
    },
  },
  missions: {
    title: 'Resistance missions',
    intro: 'Five missions to free the village. Each one unlocks after the previous one.',
    status: {
      locked: 'Locked',
      available: 'Available',
      done: 'Completed',
    },
    lockedHint: 'Complete the previous mission',
    best: 'Best score: {{score}}/{{max}}',
    attempts: '{{count}} attempt(s)',
    play: 'Play',
    replay: 'Replay',
    notFound: 'This mission doesn’t exist.',
    windows10: {
      title: 'The Windows 10 Crisis',
      intro:
        'October 2025: Windows 10 no longer gets free security updates. At the village secondary school, the 30 PCs in the computer room work just fine… but aren’t compatible with Windows 11. The Hourglass sneers: “Throw them out, buy new ones!”',
      objective: 'Decide the future of 30 working computers that no longer get updates.',
      q: {
        q1: {
          prompt: 'The school board wants your opinion. What should happen to the 30 PCs?',
          o: {
            a: {
              label: 'Replace them all with new Windows 11–compatible PCs.',
              why: 'It’s the most expensive option, and it throws away working machines. Manufacturing accounts for most of a computer’s environmental impact.',
            },
            b: {
              label: 'Keep them on Windows 10 and change nothing.',
              why: 'Without security patches, these machines on the school network become a way in for attackers. Extending their life, yes — but not without updates.',
            },
            c: {
              label: 'Pay for Microsoft’s Extended Security Updates (ESU).',
              why: 'A legitimate way to buy time, but it is paid and time-limited: the problem comes back later. Useful if it’s used to prepare a transition.',
            },
            d: {
              label: 'Test a lightweight Linux distribution on a few pilot machines, then roll it out.',
              why: 'The machines stay useful and get updates, with no licence. The pilot lets you check teaching software and train staff before going further.',
            },
          },
        },
        q2: {
          prompt: 'The technology teacher uses 3D modelling software that only runs on Windows. What do you suggest?',
          o: {
            a: {
              label: 'Give up on Linux for the whole room.',
              why: 'One specific need doesn’t justify blocking the whole transition. That case can be handled separately.',
            },
            b: {
              label: 'Keep a few machines suited to that need, and test a free alternative with them (FreeCAD, for instance).',
              why: 'Realistic: specific needs are respected, most machines move forward, and the teacher helps choose an alternative instead of having it imposed.',
            },
            c: {
              label: 'Impose an equivalent free program from the start of term.',
              why: 'Right direction, wrong method: without testing or training, they may reject the change, and their curriculum may suffer.',
            },
          },
        },
        q3: {
          prompt: 'Who supports the transition?',
          o: {
            a: {
              label: 'Nobody: pupils will adapt on their own.',
              why: 'Pupils often adapt quickly, but teachers need to prepare their lessons. Without support, the transition fails.',
            },
            b: {
              label: 'An outside contractor, in charge of everything.',
              why: 'Possible for installation, but the dependency just moves to another provider. The skills don’t stay in the school.',
            },
            c: {
              label: 'The digital lead, with short training sessions, simple documentation and help from the local authority or a non-profit.',
              why: 'The most sustainable option: skills stay on site and the team isn’t alone when problems arise.',
            },
          },
        },
      },
    },
    licenses: {
      title: 'The Licence Trap',
      intro:
        'The renewal invoice for office and photo-editing licences has just reached the high school. It eats into the school-trip budget. The Toll Collector holds out a hand: “Sign, like every year…”',
      objective: 'Reduce licence dependency without disrupting staff’s work.',
      q: {
        q1: {
          prompt: 'Where do you start?',
          o: {
            a: {
              label: 'Negotiate a discount with the vendor.',
              why: 'It eases this year’s budget but changes nothing about the dependency. Useful in the short term, not a strategy.',
            },
            b: {
              label: 'Take stock: which software, for what uses, used by whom and how often?',
              why: 'You can only replace well what you know. An inventory often reveals rarely used licences and needs covered by free software.',
            },
            c: {
              label: 'Uninstall all paid software over the holidays.',
              why: 'Brutal and risky: whole courses may depend on it. Staff would experience the change as a punishment.',
            },
          },
        },
        q2: {
          prompt: 'For office software, what do you propose?',
          o: {
            a: {
              label: 'LibreOffice on every machine, with the open ODF format by default and export to other formats when needed.',
              why: 'Free for the school and for families, no online account, a standardised format. Just test complex documents and plan a short introduction.',
            },
            b: {
              label: 'A big platform’s free online suite.',
              why: 'Handy and collaborative, but it requires an account per pupil, raises data questions and creates a new dependency. Assess it with the data protection officer.',
            },
            c: {
              label: 'Unofficial copies of the paid software.',
              why: 'Illegal and dangerous: such copies often carry malware. A school can’t set that example.',
            },
          },
        },
        q3: {
          prompt: 'The art teacher fears losing her habits in her photo-editing software. What do you do?',
          o: {
            a: {
              label: 'Tell her it’s the same and she’ll get used to it.',
              why: 'It isn’t quite the same, and brushing off a concern breeds resistance to change.',
            },
            b: {
              label: 'Keep all the graphics licences as they are.',
              why: 'Her needs are respected, but the full cost remains for every room. You can be more precise.',
            },
            c: {
              label: 'Introduce GIMP, Krita and Inkscape in a trial workshop, and keep a targeted licence if a real need isn’t covered.',
              why: 'You start from her needs, test before deciding, and keep a licence only where it’s justified.',
            },
          },
        },
      },
    },
    data: {
      title: 'The Data Fortress',
      intro:
        'A free, very popular quiz app offers to create an account for every pupil. Teachers love it. The Data Hoover rubs its hands: “Names, classes, results… thank you!”',
      objective: 'Protect pupils’ data while keeping useful tools.',
      q: {
        q1: {
          prompt: 'Before using the app with pupils, what do you check first?',
          o: {
            a: {
              label: 'Nothing: if it’s free and popular, it’s safe.',
              why: 'Popularity guarantees nothing, and “free” is sometimes paid for with data. And the school is responsible for the processing it sets up.',
            },
            b: {
              label: 'What data is collected, where it’s hosted, for how long, and whether it complies with the GDPR — with help from the education authority’s data protection officer.',
              why: 'The right approach: you check before committing minors’ data, with the right person.',
            },
            c: {
              label: 'Use it without named accounts (pseudonyms) while you check.',
              why: 'A good data-minimisation reflex that lowers the risk. But checking is still necessary: the app may collect other data (device, usage).',
            },
          },
        },
        q2: {
          prompt: 'Where should the school’s shared documents be hosted?',
          o: {
            a: {
              label: 'On a major commercial cloud, with a contract tailored to education.',
              why: 'Reliable and convenient, and a contract can bring guarantees. But data may remain subject to extraterritorial laws, and leaving will be hard. A trade-off to make knowingly.',
            },
            b: {
              label: 'On teachers’ free personal accounts.',
              why: 'Pupils’ data ends up scattered, beyond any control by the school. Avoid.',
            },
            c: {
              label: 'On services provided by the education system or the local authority (school digital workspace, apps.education.fr), or a locally managed Nextcloud.',
              why: 'Identified, regulated hosting with no commercial exploitation. Just make sure the services cover the needs and backups are in place.',
            },
          },
        },
        q3: {
          prompt: 'A parent asks what data about their child is stored. What do you answer?',
          o: {
            a: {
              label: 'That it’s their right (GDPR right of access) and that the school, which keeps a record of its processing activities, will answer.',
              why: 'Correct: families have a right of access, and the record of processing activities makes a precise answer possible.',
            },
            b: {
              label: 'Send them the terms of use of the services in use.',
              why: 'A first step towards transparency, but it doesn’t answer the request: they want to know what concerns their child.',
            },
            c: {
              label: 'That it’s none of their business.',
              why: 'Wrong: the right of access to personal data is guaranteed by the GDPR.',
            },
          },
        },
      },
    },
    reuse: {
      title: 'The Reuse Challenge',
      intro:
        'A local company donates 20 eight-year-old laptops. Tired batteries, slow hard drives. The computer club wants to give them a second life. The Locksmith growls: “Without the latest system, they’re useless!”',
      objective: 'Make these computers useful, safely, for the people who need them.',
      q: {
        q1: {
          prompt: 'First thing to do when the machines arrive?',
          o: {
            a: {
              label: 'Take everything apart to salvage the parts.',
              why: 'Some parts will be useful, but many machines can be saved whole. Strip what can’t be repaired, not everything.',
            },
            b: {
              label: 'Hand them out to families right away, as they are.',
              why: 'They may still contain the company’s data, and some may be faulty. Diagnose and wipe first.',
            },
            c: {
              label: 'Diagnose each machine, wipe the company’s data with a dedicated tool, and sort out what can be repaired.',
              why: 'Methodical and safe: you protect the donor’s data and know exactly what can be handed out.',
            },
          },
        },
        q2: {
          prompt: 'Which upgrade usually gives the best value on these old laptops?',
          o: {
            a: {
              label: 'Replace the hard drive with an SSD and, if possible, add memory.',
              why: 'The mechanical drive is often the main slowdown; an SSD and a bit of memory transform the machine at modest cost.',
            },
            b: {
              label: 'Install a miracle “speed-up” program.',
              why: 'These programs generally do nothing, and some are even unwanted software.',
            },
            c: {
              label: 'Replace only the batteries.',
              why: 'Useful for battery life, but the machine will stay slow. Worth doing if it will be used away from a socket.',
            },
          },
        },
        q3: {
          prompt: 'Who should get the refurbished machines?',
          o: {
            a: {
              label: 'Store them in a cupboard, just in case.',
              why: 'A computer sleeping in a cupboard ages without helping anyone.',
            },
            b: {
              label: 'Pupils and families without a computer, with a ready-to-use free system, a short introduction and a contact in case of trouble.',
              why: 'Digital inclusion in action: the pupil can do homework, and support keeps the device from being abandoned at the first problem.',
            },
            c: {
              label: 'Classrooms, as spare workstations.',
              why: 'Useful, but it misses the pupils who have no computer at home.',
            },
          },
        },
      },
    },
    openvillage: {
      title: 'The Open Village',
      intro:
        'The village council entrusts you with the digital strategy of its three schools for the years ahead. The Format Wall rises up: “Everyone in their own corner — it’s simpler!” Time to bring it all together.',
      objective: 'Design a more independent, sustainable and inclusive school technology ecosystem.',
      q: {
        q1: {
          prompt: 'How are tools chosen?',
          o: {
            a: {
              label: 'The digital lead decides alone: they know what they’re doing.',
              why: 'They’re competent, but an imposed choice is adopted less well. And if they leave, everything rests on one person.',
            },
            b: {
              label: 'A committee of teachers, pupils, technical staff, parents and the local authority, which defines needs before choosing.',
              why: 'Real needs are known, choices are understood and shared: the best guarantee of adoption.',
            },
            c: {
              label: 'Whichever contractor offers the biggest discount decides.',
              why: 'Price matters, but letting a supplier decide means falling back into dependency.',
            },
          },
        },
        q2: {
          prompt: 'What rule should apply to file formats?',
          o: {
            a: {
              label: 'Impose a single vendor’s format on everyone.',
              why: 'Everyone becomes dependent on that vendor, and families without its software are penalised.',
            },
            b: {
              label: 'Let everyone use their own software’s format.',
              why: 'Apparent freedom, but exchanges become painful and archives unreadable. A shared rule makes life easier.',
            },
            c: {
              label: 'Favour open formats (ODF, PDF, PNG, HTML…) so tools can change without losing documents.',
              why: 'Documents outlive software and circulate between everyone. Just test important documents when converting.',
            },
          },
        },
        q3: {
          prompt: 'How do you make the change last?',
          o: {
            a: {
              label: 'Move step by step with pilots, measure, keep training and share with other schools.',
              why: 'You learn from each step, pool efforts, and successes encourage the next schools.',
            },
            b: {
              label: 'Switch everything over one weekend.',
              why: 'A sudden change piles up problems all at once and discourages staff.',
            },
            c: {
              label: 'Wait for a solution to be imposed from above.',
              why: 'National frameworks help, but waiting loses years. Every school can already act at its own level.',
            },
          },
        },
        q4: {
          prompt: 'A visually impaired pupil joins the school. What does the strategy plan for?',
          o: {
            a: {
              label: 'Accessibility will come later, once everything is installed.',
              why: 'Retrofitting accessibility is expensive, and the pupil is held back in the meantime.',
            },
            b: {
              label: 'Check each tool’s accessibility when choosing it (screen reader, keyboard, contrast) and train the team; free screen readers such as NVDA or Orca exist.',
              why: 'Inclusion is part of choosing tools, not an option added afterwards. And these good practices benefit every pupil.',
            },
            c: {
              label: 'Give her specific equipment, without changing anything else.',
              why: 'Useful, but if the school’s platforms and documents aren’t accessible, the equipment isn’t enough.',
            },
          },
        },
      },
    },
  },
  play: {
    objective: 'Objective',
    start: 'Start the mission',
    question: 'Question {{n}}/{{total}}',
    hint: 'Mentor hint ({{cost}} coins)',
    hintUsed: 'The mentor ruled out a weak option.',
    hintPoor: 'Not enough coins for a hint.',
    removed: 'Option ruled out by the mentor',
    verdict: {
      best: 'Excellent choice!',
      ok: 'Not bad, but there’s better…',
      bad: 'Ouch! That choice strengthens the Empire.',
    },
    yourChoice: 'Your choice',
    bestChoice: 'The soundest choice',
    finish: 'See the result',
    resultTitle: 'Mission complete!',
    score: 'Score: {{score}}/{{max}}',
    firstClear: 'First victory!',
    newBest: 'New record!',
    noGain: 'No new record: replaying only pays if you beat your best score.',
    gained: 'Earned: +{{xp}} XP · +{{coins}} coins',
    replay: 'Replay',
    nextMission: 'Next mission',
    toVillage: 'Back to the village',
    toVictory: 'Free the tower!',
    keys: 'Keys A, B, C, D to answer',
    quit: 'Leave the mission',
  },
  achievements: {
    title: 'Achievements',
    first_mission: { name: 'First spark', desc: 'Complete your first mission.' },
    perfect_mission: { name: 'Flawless', desc: 'Get the maximum score in a mission.' },
    comeback: { name: 'Never give up', desc: 'Replay a mission and beat your best score.' },
    all_missions: { name: 'Village freed', desc: 'Complete all five missions.' },
    perfectionist: { name: 'Perfectionist', desc: 'Maximum score in every mission.' },
    scholar: { name: 'Archivist', desc: 'Read every enemy file.' },
    engineer: { name: 'Free engineer', desc: 'Master all seven workshop modules.' },
    explorer: { name: 'Explorer', desc: 'Visit every place in the village.' },
    sociable: { name: 'Soul of the village', desc: 'Talk to every villager.' },
    veteran: { name: 'Veteran', desc: 'Reach level 5.' },
  },
  profile: {
    title: 'Resistance HQ',
    stats: 'Statistics',
    xp: 'Total XP',
    coins: 'Coins',
    coinsEarned: 'Coins earned',
    coinsSpent: 'Coins spent on hints',
    missions: 'Missions completed',
    perfect: 'Flawless missions',
    attempts: 'Attempts',
    enemies: 'Files read',
    modules: 'Modules mastered',
    places: 'Places visited',
    npcs: 'Villagers met',
    score: 'Resistance score',
    achievements: 'Achievements unlocked: {{count}}/{{total}}',
    lockedAchievement: 'Locked achievement',
    unlockedOn: 'Unlocked on {{date}}',
    victory: 'See the victory summary',
    reset: 'Erase my progress',
    resetTitle: 'Erase progress?',
    resetText: 'Missions, XP, coins and achievements will be erased from this browser. This cannot be undone.',
    resetYes: 'Yes, erase everything',
  },
  victory: {
    title: 'VICTORY!',
    subtitle: 'The tower has fallen. The village has regained its digital independence.',
    locked: 'Victory must be earned: complete all five missions to free the tower.',
    toMissions: 'See the missions',
    score: 'Resistance score',
    missions: 'Missions',
    xp: 'XP earned',
    achievements: 'Achievements',
    summary: 'Digital independence summary',
    summaryIntro: 'Based on your best choices in each mission:',
    recs: 'Personalised recommendations',
    perfect: 'Your choices were sound across the board. Next step: share this approach with your own school and start with an inventory, just like Karim.',
    modules: 'Revisit in the workshop:',
    restart: 'New game',
    replay: 'Replay missions',
    toMenu: 'Main menu',
  },
  recs: {
    hardware:
      'Hardware: before replacing a device, check whether it can be upgraded (SSD, memory) and moved to a maintained system. Reuse is often both the cheapest and the greenest choice.',
    software:
      'Software: start from actual uses. Free software covers most everyday needs, but a pilot and testing avoid nasty surprises with specialised uses.',
    data: 'Data: before adopting a service, ask what data it collects, where it hosts it and why. Your education authority’s data protection officer is your ally.',
    people:
      'People: no transition holds without people. Involve teachers, pupils and families in decisions, train them, and think about accessibility from the start.',
    openness:
      'Openness: open formats and interoperable tools leave you free to change. A simple school-wide rule (ODF to edit, PDF to share) is enough to begin.',
  },
  notFound: {
    title: 'Uncharted area',
    text: 'This path leads nowhere in the village.',
    back: 'Back to the menu',
  },
}
