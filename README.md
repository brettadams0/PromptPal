# PromptPal - AI Prompt Builder

[![CI](https://github.com/brettadams0/PromptPal/actions/workflows/ci.yml/badge.svg)](https://github.com/brettadams0/PromptPal/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A modern, intuitive web application for creating high-quality prompts for ChatGPT, Claude, and other AI models.

## 🚀 Features

- **Smart Templates**: Pre-built templates for various use cases
- **Real-time Preview**: See your prompt as you build it
- **Custom Variables**: Dynamic placeholders for personalized prompts
- **Multiple Formats**: Export in text, markdown, JSON, and more
- **Dark/Light Mode**: Beautiful themes for any preference
- **Mobile Responsive**: Works perfectly on all devices
- **Local Storage**: Save your prompts and preferences locally

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom components
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/brettadams0/promptpal.git
cd promptpal
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
prompt-builder/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── forms/             # Form-specific components
│   │   ├── prompt/            # Prompt-related components
│   │   └── layout/            # Layout components
│   ├── lib/
│   │   ├── utils.ts           # Utility functions
│   │   ├── types.ts           # TypeScript types
│   │   └── constants.ts       # App constants
│   └── hooks/                 # Custom React hooks
├── public/                    # Static assets
└── docs/                      # Documentation
```

## 🎨 Design System

### Colors
- **Primary**: Blue (#0ea5e9) - Main brand color
- **Secondary**: Gray (#64748b) - Supporting elements
- **Accent**: Purple (#d946ef) - Highlights and CTAs
- **Success**: Green (#22c55e) - Positive states
- **Warning**: Yellow (#f59e0b) - Caution states
- **Error**: Red (#ef4444) - Error states

### Typography
- **Font**: Inter (Google Fonts)
- **Code Font**: JetBrains Mono
- **Responsive**: Mobile-first approach

### Breakpoints
- **xs**: 320px
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests

### Code Quality

- **ESLint**: Configured with TypeScript and React rules
- **Prettier**: Code formatting with Tailwind CSS plugin
- **TypeScript**: Strict mode enabled
- **Git Hooks**: Pre-commit checks (recommended)

## 📋 Roadmap

### Phase 1: Foundation ✅
- [x] Project initialization
- [x] Environment setup
- [x] Design system foundation

### Phase 2: Core UI
- [ ] Main layout structure
- [ ] Prompt configuration form
- [ ] Real-time prompt preview

### Phase 3: Prompt Logic
- [ ] Prompt template system
- [ ] Task type definitions
- [ ] Advanced prompt options

### Phase 4: User Experience
- [ ] Prompt library
- [ ] Local storage & preferences
- [ ] Sharing & export features

### Phase 5: Polish
- [ ] Performance optimization
- [ ] Accessibility implementation
- [ ] Mobile experience polish

### Phase 6: Testing
- [ ] Unit & integration testing
- [ ] End-to-end testing
- [ ] Performance & security audit

### Phase 7: Launch
- [ ] User documentation
- [ ] Launch preparation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- **Email**: adamsbrett00@gmail.com
- **GitHub Issues**: [Report a bug](https://github.com/brettadams0/promptpal/issues)

---


Built with ❤️ for the AI community 
