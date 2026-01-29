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
  Sparkles,
  Bot
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
      className={`p-6 rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
        selected
          ? 'border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-500/30'
          : 'border-slate-600 bg-slate-800/50 hover:border-emerald-400/50 hover:bg-slate-700/50'
      }`}
    >
      <div className="text-4xl mb-2">{categoryIcons[category]}</div>
      <div className={`font-medium ${selected ? 'text-emerald-50' : 'text-slate-200'}`}>{category}</div>
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
    Easy: selected ? 'bg-orange-500 shadow-lg shadow-orange-500/50' : 'bg-slate-700/50 hover:bg-orange-500/20 border-2 border-slate-600 hover:border-orange-400/50',
    Medium: selected ? 'bg-orange-500 shadow-lg shadow-orange-500/50' : 'bg-slate-700/50 hover:bg-orange-500/20 border-2 border-slate-600 hover:border-orange-400/50',
    Hard: selected ? 'bg-orange-500 shadow-lg shadow-orange-500/50' : 'bg-slate-700/50 hover:bg-orange-500/20 border-2 border-slate-600 hover:border-orange-400/50'
  }

  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-lg font-medium transition-all ${colors[difficulty]} ${
        selected ? 'text-white' : 'text-slate-200'
      }`}
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
          ? 'border-cyan-400 bg-cyan-500/20 shadow-md shadow-cyan-500/30'
          : 'border-slate-600 bg-slate-800/50 hover:border-cyan-400/50 hover:bg-slate-700/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className={`font-medium ${selected ? 'text-cyan-50' : 'text-slate-200'}`}>{option}</div>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl bg-slate-900/95 border-slate-700 shadow-2xl shadow-emerald-500/10">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Bot className="h-12 w-12 text-emerald-400" />
            </div>
            <CardTitle className="text-4xl text-emerald-50 mb-2">Trivia Master</CardTitle>
            <CardDescription className="text-slate-300 text-lg">
              Test your knowledge across various topics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Category Selection */}
            <div>
              <h3 className="text-emerald-50 font-semibold mb-4 text-lg">Select Category</h3>
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

            <Separator className="bg-slate-700" />

            {/* Difficulty Selection */}
            <div>
              <h3 className="text-emerald-50 font-semibold mb-4 text-lg">Select Difficulty</h3>
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
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-emerald-500/30"
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
              <div className="text-rose-200 text-center p-3 bg-rose-500/20 rounded-lg border border-rose-500/30">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl bg-slate-900/95 border-slate-700 shadow-2xl shadow-cyan-500/10">
          <CardHeader>
            {/* Score Display */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                <span className="text-emerald-50 font-semibold">
                  Score: {score.correct}/{score.total}
                </span>
              </div>
              <Badge variant="outline" className="text-cyan-300 border-cyan-600 bg-cyan-500/10">
                {score.percentage}%
              </Badge>
            </div>

            {/* Progress Bar */}
            <Progress value={score.percentage} className="mb-4 bg-slate-700 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-cyan-500" />

            <CardTitle className="text-2xl text-emerald-50">{question?.text}</CardTitle>
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
              <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-violet-400 mt-0.5 flex-shrink-0" />
                  <p className="text-slate-200 text-sm">{commentary}</p>
                </div>
              </div>
            )}

            <Button
              onClick={submitAnswer}
              disabled={!selectedAnswer || loading}
              size="lg"
              className="w-full bg-gradient-to-r from-amber-700 to-orange-800 hover:from-amber-800 hover:to-orange-900 text-white shadow-lg shadow-amber-700/30"
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
              <div className="text-rose-200 text-center p-3 bg-rose-500/20 rounded-lg border border-rose-500/30">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl bg-slate-900/95 border-slate-700 shadow-2xl shadow-cyan-500/10">
          <CardHeader>
            {/* Score Display */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                <span className="text-emerald-50 font-semibold">
                  Score: {score.correct}/{score.total}
                </span>
              </div>
              <Badge variant="outline" className="text-cyan-300 border-cyan-600 bg-cyan-500/10">
                {score.percentage}%
              </Badge>
            </div>

            {/* Progress Bar */}
            <Progress value={score.percentage} className="mb-4 bg-slate-700 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-cyan-500" />

            <CardTitle className="text-2xl text-emerald-50">{question?.text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Feedback */}
            {feedback && (
              <div>
                <div className={`flex items-center gap-3 mb-4 p-4 rounded-lg shadow-lg ${
                  feedback.is_correct
                    ? 'bg-emerald-500/20 border-2 border-emerald-400/50 shadow-emerald-500/30'
                    : 'bg-rose-500/20 border-2 border-rose-400/50 shadow-rose-500/30'
                }`}>
                  {feedback.is_correct ? (
                    <CheckCircle className="h-8 w-8 text-emerald-300 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-8 w-8 text-rose-300 flex-shrink-0" />
                  )}
                  <div>
                    <p className={`font-semibold text-lg ${
                      feedback.is_correct ? 'text-emerald-100' : 'text-rose-100'
                    }`}>
                      {feedback.message}
                    </p>
                  </div>
                </div>

                {/* Explanation */}
                <div className="p-4 bg-sky-500/10 border border-sky-500/30 rounded-lg">
                  <h4 className="text-sky-200 font-semibold mb-2">Explanation</h4>
                  <p className="text-slate-200">{feedback.explanation}</p>
                </div>
              </div>
            )}

            {/* Correct Answer */}
            {question && (
              <div className="p-3 bg-slate-800/70 rounded-lg border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Correct Answer:</p>
                <p className="text-emerald-300 font-semibold">
                  {question.options.find(opt => opt.startsWith(question.correct_answer))}
                </p>
              </div>
            )}

            {/* Commentary */}
            {commentary && (
              <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-violet-400 mt-0.5 flex-shrink-0" />
                  <p className="text-slate-200 text-sm">{commentary}</p>
                </div>
              </div>
            )}

            <Button
              onClick={nextQuestion}
              disabled={loading}
              size="lg"
              className="w-full bg-gradient-to-r from-amber-700 to-orange-800 hover:from-amber-800 hover:to-orange-900 text-white shadow-lg shadow-amber-700/30"
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
              <div className="text-rose-200 text-center p-3 bg-rose-500/20 rounded-lg border border-rose-500/30">
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
    let performanceGradient = ''

    if (score.percentage >= 80) {
      performanceMessage = 'Outstanding Performance!'
      performanceColor = 'text-emerald-300'
      performanceGradient = 'from-emerald-500/30 to-teal-500/30 border-emerald-500/40'
    } else if (score.percentage >= 60) {
      performanceMessage = 'Good Job!'
      performanceColor = 'text-cyan-300'
      performanceGradient = 'from-cyan-500/30 to-blue-500/30 border-cyan-500/40'
    } else if (score.percentage >= 40) {
      performanceMessage = 'Nice Try!'
      performanceColor = 'text-amber-300'
      performanceGradient = 'from-amber-500/30 to-orange-500/30 border-amber-500/40'
    } else {
      performanceMessage = 'Keep Practicing!'
      performanceColor = 'text-orange-300'
      performanceGradient = 'from-orange-500/30 to-rose-500/30 border-orange-500/40'
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-slate-900/95 border-slate-700 shadow-2xl shadow-emerald-500/10">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Trophy className="h-16 w-16 text-amber-400" />
            </div>
            <CardTitle className="text-4xl text-emerald-50 mb-2">Game Over!</CardTitle>
            <CardDescription className={`text-2xl font-semibold ${performanceColor}`}>
              {performanceMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Final Score */}
            <div className={`text-center p-8 bg-gradient-to-br ${performanceGradient} rounded-lg border shadow-lg`}>
              <p className="text-slate-300 text-lg mb-2">Final Score</p>
              <p className="text-6xl font-bold text-white mb-2">
                {score.correct}/{score.total}
              </p>
              <p className={`text-3xl ${performanceColor}`}>{score.percentage}%</p>
            </div>

            {/* Commentary */}
            {commentary && (
              <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-violet-400 mt-0.5 flex-shrink-0" />
                  <p className="text-slate-200">{commentary}</p>
                </div>
              </div>
            )}

            <Button
              onClick={playAgain}
              size="lg"
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-emerald-500/30"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-emerald-400 animate-spin mx-auto mb-4" />
        <p className="text-emerald-50 text-lg">Loading Trivia Master...</p>
      </div>
    </div>
  )
}
