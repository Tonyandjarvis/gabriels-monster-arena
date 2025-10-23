# Gabriel's Monster Arena

## Project Overview

**Gabriel's Monster Arena** is a tower defense / monster capture game designed for mobile platforms (iPad first) with an accessible, kid-friendly approach. This project serves as both a fun game and a learning journey for Gabriel and family.

## Vision & Purpose

- Create a fun, accessible game that Gabriel (almost 11) can both play and feel proud of making
- Start simple as a learning tool but with extensibility in mind
- Encourage creativity through Gabriel's monster designs and gameplay ideas
- Use as a learning journey from foundations to more advanced concepts

## Target Platform & Technology

- **Primary Platform**: Mobile (iPad first, cross-platform potential)
- **Engine**: Godot 4.x (recommended for its free, lightweight nature)
- **Alternative**: Unity (free tier) if preferred
- **Version Control**: Git locally with optional GitHub backup

## Core Gameplay Loop (MVP)

1. Player sees an arena/level
2. Summons or places monsters to defend against enemy waves
3. Simple UI: start game → choose monsters → waves spawn → defeat them → level complete
4. Monsters: Gabriel's unique designs with individual abilities
5. Enemy waves: Basic AI with pathfinding to target
6. Upgrades/evolution: Monster enhancement after waves or levels

### MVP Scope
- **1 level** with arena environment
- **3 monster types** with unique appearances and abilities
- **1 enemy wave pattern** for initial testing
- Basic upgrade/evolution system

## Art & Theme

- **Monsters**: Friendly fantasy style (semi-realistic blobs/animals/gems)
- **Colors**: Vibrant, kid-friendly but not overly cartoonish
- **UI**: Clean, intuitive design with large buttons for mobile
- **Sound**: Simple happy/fantasy music with monster spawn and victory effects

## Project Structure

```
Gabriel's Game/
├── Assets/
│   ├── Monsters/          # Gabriel's monster designs
│   ├── UI/               # Interface elements
│   ├── Backgrounds/      # Arena and level environments
│   └── Audio/           # Music and sound effects
├── Scripts/             # Game logic and mechanics
├── Scenes/              # Levels, menus, and game scenes
├── Docs/                # Design documents and task lists
└── Build/               # Compiled versions
```

## Milestones & Timeline

### Milestone 1 (2-4 weeks)
- Set up project folder and engine
- Create 3 monster designs from Gabriel's assets
- Basic level scene and wave spawn logic
- Test run on PC/desktop

### Milestone 2 (4-8 weeks)
- Add upgrade/evolution system for monsters
- Add UI menus (monster select, level start, result screen)
- Build for iPad testing

### Milestone 3 (8-12 weeks)
- Additional levels
- More monsters/unlock logic
- Polish art/sound
- Build and deploy/share with friends/family

## Stretch Goals

- Multiple levels/environments
- More monsters and unlockables
- In-game monster designer for Gabriel
- Optional monetization (ads or one-time purchase)
- Export to additional platforms (Android, web)

## Technical Requirements

- **Performance**: Keep simple for MVP with fewer assets and basic logic
- **Learning Curve**: Teach Gabriel basic programming concepts (events, variables, triggers)
- **Device Compatibility**: Fine-tune for iPad while maintaining desktop development capability

## Responsibilities

- **Parent**: Engine setup, folder structure, technical guidance, Git/versioning
- **Gabriel**: Monster designs, gameplay testing, feedback, UI ideas, game ownership
- **Cursor AI**: Code scaffolding, folder setup, template generation, task suggestions

## Getting Started

1. Review this README and project scope
2. Choose between Godot 4.x or Unity based on preference
3. Clone one of the recommended starter templates
4. Import Gabriel's monster art into the Assets folder
5. Follow the task list in `Docs/Tasks.md`

## Recommended Starter Templates

- **Godot 4**: alpapaydin/Godot-4-Tower-Defense-Template (MIT License)
- **Godot 4**: quiver-dev/tower-defense-tutorial (MIT License)  
- **Unity**: Brackeys/Tower-Defense-Tutorial (Unlicense)

---

*This project is designed to grow with Gabriel's interests and skills while creating something genuinely enjoyable and playable.*
