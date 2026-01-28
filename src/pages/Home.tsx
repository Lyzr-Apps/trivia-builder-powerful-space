import { useState } from 'react'
import { callAIAgent } from '@/utils/aiAgent'
import type { NormalizedAgentResponse } from '@/utils/aiAgent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  Trophy,
  Loader2,
  Sparkles
} from 'lucide-react'

// Agent Configuration
const AGENT_ID = "6979bd37a5d355f8aa489bab"

// TypeScript interfaces based on actual_test_response from schema
interface Question {
  text: string
  options: string[]
  correct_answer: string
}

interface Feedback {
  is_correct: boolean
  message: string
  explanation: string
}

interface Score {
  correct: number
  total: number
  percentage: number
}

interface TriviaResult {
  game_state: string
  question: Question | null
  feedback: Feedback | null
  score: Score
  commentary: string
}

interface TriviaResponse extends NormalizedAgentResponse {
  result: TriviaResult
}

type GameState = 'setup' | 'question' | 'feedback' | 'game_over'
type Category = 'Science' | 'History' | 'Geography' | 'Entertainment' | 'Sports'
type Difficulty = 'Easy' | 'Medium' | 'Hard'

// Category selection component
function CategoryCard({
  category,
  selected,
  onClick
}: {
  category: Category
  selected: boolean
  onClick: () => void
}) {
  const categoryIcons: Record<Category, string> = {
    Science: '🔬',
    History: '📚',
    Geography: '🌍',
    Entertainment: '🎬',
    Sports: '⚽'
  }

  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-lg border-2 transition-all ${
        selected
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
      }`}
    >
      <div className="text-4xl mb-2">{categoryIcons[category]}</div>
      <div className="text-white font-medium">{category}</div>
    </button>
  )
}

// Difficulty selection component
function DifficultyButton({
  difficulty,
  selected,
  onClick
}: {
  difficulty: Difficulty
  selected: boolean
  onClick: () => void
}) {
  const colors: Record<Difficulty, string> = {
    Easy: selected ? 'bg-green-500' : 'bg-gray-700 hover:bg-green-500/20',
    Medium: selected ? 'bg-yellow-500' : 'bg-gray-700 hover:bg-yellow-500/20',
    Hard: selected ? 'bg-red-500' : 'bg-gray-700 hover:bg-red-500/20'
  }

  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-lg font-medium text-white transition-all ${colors[difficulty]}`}
    >
      {difficulty}
    </button>
  )
}

// Answer option button component
function AnswerOption({
  option,
  selected,
  disabled,
  onClick
}: {
  option: string
  selected: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
        selected
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="text-white font-medium">{option}</div>
    </button>
  )
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('setup')
  const [category, setCategory] = useState<Category>('Science')
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium')
  const [response, setResponse] = useState<TriviaResponse | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string>('')

  // Start new game
  const startGame = async () => {
    setLoading(true)
    setError(null)
    const newSessionId = `trivia-${Date.now()}`
    setSessionId(newSessionId)

    const result = await callAIAgent(
      `Start a new trivia game. Category: ${category}, Difficulty: ${difficulty}. Give me the first question.`,
      AGENT_ID,
      { session_id: newSessionId }
    )

    setLoading(false)

    if (result.success && result.response.status === 'success') {
      const triviaResponse = result.response as TriviaResponse
      setResponse(triviaResponse)

      // Determine game state from agent response
      if (triviaResponse.result.game_state === 'question') {
        setGameState('question')
      } else if (triviaResponse.result.game_state === 'feedback') {
        setGameState('feedback')
      }
      setSelectedAnswer(null)
    } else {
      setError(result.error || 'Failed to start game')
    }
  }

  // Submit answer
  const submitAnswer = async () => {
    if (!selectedAnswer) return

    setLoading(true)
    setError(null)

    const result = await callAIAgent(
      `My answer is: ${selectedAnswer}`,
      AGENT_ID,
      { session_id: sessionId }
    )

    setLoading(false)

    if (result.success && result.response.status === 'success') {
      const triviaResponse = result.response as TriviaResponse
      setResponse(triviaResponse)
      setGameState('feedback')
    } else {
      setError(result.error || 'Failed to submit answer')
    }
  }

  // Get next question
  const nextQuestion = async () => {
    setLoading(true)
    setError(null)
    setSelectedAnswer(null)

    const result = await callAIAgent(
      'Give me the next question',
      AGENT_ID,
      { session_id: sessionId }
    )

    setLoading(false)

    if (result.success && result.response.status === 'success') {
      const triviaResponse = result.response as TriviaResponse
      setResponse(triviaResponse)

      if (triviaResponse.result.game_state === 'question') {
        setGameState('question')
      } else if (triviaResponse.result.game_state === 'game_over') {
        setGameState('game_over')
      }
    } else {
      setError(result.error || 'Failed to get next question')
    }
  }

  // Play again
  const playAgain = () => {
    setGameState('setup')
    setResponse(null)
    setSelectedAnswer(null)
    setSessionId('')
  }

  // Render setup screen
  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl bg-gray-900/90 border-gray-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Sparkles className="h-12 w-12 text-yellow-400" />
            </div>
            <CardTitle className="text-4xl text-white mb-2">Trivia Master</CardTitle>
            <CardDescription className="text-gray-300 text-lg">
              Test your knowledge across various topics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Category Selection */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-lg">Select Category</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {(['Science', 'History', 'Geography', 'Entertainment', 'Sports'] as Category[]).map((cat) => (
                  <CategoryCard
                    key={cat}
                    category={cat}
                    selected={category === cat}
                    onClick={() => setCategory(cat)}
                  />
                ))}
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Difficulty Selection */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-lg">Select Difficulty</h3>
              <div className="flex gap-4 justify-center">
                {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((diff) => (
                  <DifficultyButton
                    key={diff}
                    difficulty={diff}
                    selected={difficulty === diff}
                    onClick={() => setDifficulty(diff)}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={startGame}
              disabled={loading}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Starting Game...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Start Game
                </>
              )}
            </Button>

            {error && (
              <div className="text-red-400 text-center p-3 bg-red-500/10 rounded-lg">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render question screen
  if (gameState === 'question' && response?.result) {
    const { question, score, commentary } = response.result

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl bg-gray-900/90 border-gray-700">
          <CardHeader>
            {/* Score Display */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                <span className="text-white font-semibold">
                  Score: {score.correct}/{score.total}
                </span>
              </div>
              <Badge variant="outline" className="text-white border-gray-600">
                {score.percentage}%
              </Badge>
            </div>

            {/* Progress Bar */}
            <Progress value={score.percentage} className="mb-4" />

            <CardTitle className="text-2xl text-white">{question?.text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Answer Options */}
            <div className="space-y-3">
              {question?.options.map((option, index) => (
                <AnswerOption
                  key={index}
                  option={option}
                  selected={selectedAnswer === option}
                  disabled={loading}
                  onClick={() => setSelectedAnswer(option)}
                />
              ))}
            </div>

            {/* Commentary */}
            {commentary && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">{commentary}</p>
                </div>
              </div>
            )}

            <Button
              onClick={submitAnswer}
              disabled={!selectedAnswer || loading}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Answer'
              )}
            </Button>

            {error && (
              <div className="text-red-400 text-center p-3 bg-red-500/10 rounded-lg">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render feedback screen
  if (gameState === 'feedback' && response?.result) {
    const { question, feedback, score, commentary } = response.result

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl bg-gray-900/90 border-gray-700">
          <CardHeader>
            {/* Score Display */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                <span className="text-white font-semibold">
                  Score: {score.correct}/{score.total}
                </span>
              </div>
              <Badge variant="outline" className="text-white border-gray-600">
                {score.percentage}%
              </Badge>
            </div>

            {/* Progress Bar */}
            <Progress value={score.percentage} className="mb-4" />

            <CardTitle className="text-2xl text-white">{question?.text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Feedback */}
            {feedback && (
              <div>
                <div className={`flex items-center gap-3 mb-4 p-4 rounded-lg ${
                  feedback.is_correct
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-red-500/10 border border-red-500/30'
                }`}>
                  {feedback.is_correct ? (
                    <CheckCircle className="h-8 w-8 text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-400 flex-shrink-0" />
                  )}
                  <div>
                    <p className={`font-semibold text-lg ${
                      feedback.is_correct ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {feedback.message}
                    </p>
                  </div>
                </div>

                {/* Explanation */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h4 className="text-white font-semibold mb-2">Explanation</h4>
                  <p className="text-gray-300">{feedback.explanation}</p>
                </div>
              </div>
            )}

            {/* Correct Answer */}
            {question && (
              <div className="p-3 bg-gray-800 rounded-lg">
                <p className="text-gray-400 text-sm mb-1">Correct Answer:</p>
                <p className="text-green-400 font-semibold">
                  {question.options.find(opt => opt.startsWith(question.correct_answer))}
                </p>
              </div>
            )}

            {/* Commentary */}
            {commentary && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">{commentary}</p>
                </div>
              </div>
            )}

            <Button
              onClick={nextQuestion}
              disabled={loading}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading...
                </>
              ) : (
                'Next Question'
              )}
            </Button>

            {error && (
              <div className="text-red-400 text-center p-3 bg-red-500/10 rounded-lg">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render game over screen
  if (gameState === 'game_over' && response?.result) {
    const { score, commentary } = response.result

    let performanceMessage = ''
    let performanceColor = ''

    if (score.percentage >= 80) {
      performanceMessage = 'Outstanding Performance!'
      performanceColor = 'text-green-400'
    } else if (score.percentage >= 60) {
      performanceMessage = 'Good Job!'
      performanceColor = 'text-blue-400'
    } else if (score.percentage >= 40) {
      performanceMessage = 'Nice Try!'
      performanceColor = 'text-yellow-400'
    } else {
      performanceMessage = 'Keep Practicing!'
      performanceColor = 'text-orange-400'
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-gray-900/90 border-gray-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Trophy className="h-16 w-16 text-yellow-400" />
            </div>
            <CardTitle className="text-4xl text-white mb-2">Game Over!</CardTitle>
            <CardDescription className={`text-2xl font-semibold ${performanceColor}`}>
              {performanceMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Final Score */}
            <div className="text-center p-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
              <p className="text-gray-400 text-lg mb-2">Final Score</p>
              <p className="text-6xl font-bold text-white mb-2">
                {score.correct}/{score.total}
              </p>
              <p className="text-3xl text-blue-400">{score.percentage}%</p>
            </div>

            {/* Commentary */}
            {commentary && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300">{commentary}</p>
                </div>
              </div>
            )}

            <Button
              onClick={playAgain}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Play Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fallback/loading state
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-white animate-spin mx-auto mb-4" />
        <p className="text-white text-lg">Loading Trivia Master...</p>
      </div>
    </div>
  )
}
