# 3D Gridworld Q-Learning

A reinforcement learning implementation of Q-learning algorithm in a 3D gridworld environment with stochastic transitions and interactive visualizations.

## Project Overview

This project implements Q-learning to solve a navigation problem in a 3D grid environment. The agent learns to navigate from a start position to a goal while avoiding obstacles and a pit, dealing with stochastic state transitions.

## Features

- **3D Environment**: 6×6×6 gridworld with configurable dimensions
- **Stochastic Transitions**: Slip probability with perpendicular direction movements
- **Q-Learning Algorithm**: Epsilon-greedy exploration with temporal difference learning
- **Real-time Visualization**: 
  - Learning curves (episode rewards with moving average)
  - Value function heatmaps per Z-level
  - Policy arrows showing optimal actions
- **Interactive Controls**: Z-level slider to explore different depth slices
- **Performance Evaluation**: Comparison between learned policy and random baseline

## Problem Specification

### MDP Formulation

- **States (S)**: All free cells (x, y, z) in the 3D grid, excluding obstacles
- **Actions (A)**: 6 directional moves
  - `+x` (East), `-x` (West)
  - `+y` (North), `-y` (South)
  - `+z` (Up), `-z` (Down)
- **Transitions (P)**: Stochastic movements
  - Probability `p`: Move in intended direction (default: 0.8)
  - Probability `1-p`: Slip uniformly to one of 4 perpendicular directions (0.2)
  - Stay in place if blocked by obstacle or boundary
- **Rewards (R)**:
  - Step cost: `-1` per action
  - Goal: `+50` (absorbing state at position [5,5,5])
  - Pit: `-50` (absorbing state at position [2,2,2])
- **Discount Factor (γ)**: 0.95

### Environment Details

- **Grid Dimensions**: 6×6×6 (216 total cells)
- **Obstacles**: ~12% of cells randomly placed (fixed seed for reproducibility)
- **Start Position**: [0, 0, 0]
- **Goal Position**: [5, 5, 5]
- **Pit Position**: [2, 2, 2]

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Deepu1728/3d-gridworld-qlearning.git
   cd 3d-gridworld-qlearning
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

##  Usage

1. **Start Training**: Click the "Start Training" button to begin Q-learning for 1000 episodes
2. **Monitor Progress**: Watch real-time learning curves showing episode rewards
3. **View Results**: After training completes, see evaluation metrics comparing learned vs random policy
4. **Explore Visualization**: Use the Z-level slider to view value functions and policy arrows at different depth levels

### Hyperparameters

- **Learning Rate (α)**: 0.1
- **Discount Factor (γ)**: 0.95
- **Exploration Rate (ε)**: 0.1 (epsilon-greedy)
- **Episodes**: 1000
- **Max Steps per Episode**: 200

## Implementation Details

### Q-Learning Update Rule

```
Q(s,a) ← Q(s,a) + α[r + γ max Q(s',a') - Q(s,a)]
                              a'
```

### Greedy Policy Extraction

```
π(s) = argmax Q(s,a)
          a
```

### Key Components

1. **GridWorld3D Class**: Environment implementation
   - State management
   - Action execution with stochastic transitions
   - Reward calculation
   - Obstacle generation (seeded for reproducibility)

2. **Q-Learning Agent**: 
   - Q-table stored as dictionary for sparse representation
   - ε-greedy action selection
   - Temporal difference learning updates

3. **Visualization**:
   - SVG-based learning curves
   - Grid-based heatmap for value functions
   - Arrow symbols for policy directions

## Results

The trained agent demonstrates:
- Convergence of Q-values over episodes
- Significant improvement over random policy baseline
- Ability to navigate around obstacles
- Optimal paths considering stochastic transitions

### Policy Arrows Legend

- `→` East (+x direction)
- `←` West (-x direction)
- `↑` North (+y direction)
- `↓` South (-y direction)
- `⊕` Up (+z direction)
- `⊖` Down (-z direction)

### Color Coding

- **Green (G)**: Goal (+50 reward)
- **Red (P)**: Pit (-50 reward)
- **Black**: Obstacles
- **Blue gradient**: Value function intensity (darker = higher value)

## Technologies Used

- **React**: UI framework
- **Vite**: Build tool and dev server
- **Lucide React**: Icons
- **JavaScript**: Core implementation

##  Project Structure

```
3d-gridworld-qlearning/
├── src/
│   ├── App.jsx           # Main component with Q-learning implementation
│   ├── index.css         # Global styles
│   └── main.jsx          # Entry point
├── public/               # Static assets
├── index.html            # HTML template
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite configuration
└── README.md             # README
```

## Experiments

You can modify the following parameters to run experiments:

1. **Discount Factor (γ)**: Change in `startTraining()` function
2. **Slip Probability**: Modify in `GridWorld3DClass` constructor
3. **Step Cost**: Adjust reward in `step()` method
4. **Grid Size**: Change dimensions in `GridWorld3DClass` initialization
5. **Exploration Rate (ε)**: Tune epsilon value for exploration vs exploitation



## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

##  License

This project is open source and available under the [MIT License](LICENSE).

##  Author

**Deepansh Saha**
- GitHub: [@Deepu1728](https://github.com/Deepu1728)

## Acknowledgments

- Reinforcement Learning course materials
- Sutton & Barto - Reinforcement Learning: An Introduction
- React and Vite documentation


**Note**: This is an academic project demonstrating Q-learning in a 3D environment with stochastic transitions. The obstacle placement uses a fixed random seed (42) to ensure reproducibility across runs.
