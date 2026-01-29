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
  Bot,
  Rocket,
  BookOpen,
  Globe,
  Film,
  Dumbbell,
  User
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

// Header component
function Header() {
  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-3">
          <img
            src="https://asset.lyzr.app/k7ESQXrU"
            alt="Profile"
            className="h-10 w-10 rounded-full object-cover"
          />
          <h1 className="text-2xl font-bold text-gray-900">Hello World</h1>
        </div>
      </div>
    </header>
  )
}

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
  const getCategoryIcon = (cat: Category) => {
    const iconClass = `h-10 w-10 ${selected ? 'text-white' : 'text-gray-600'}`

    switch(cat) {
      case 'Science':
        return <Rocket className={iconClass} />
      case 'History':
        return <BookOpen className={iconClass} />
      case 'Geography':
        return <Globe className={iconClass} />
      case 'Entertainment':
        return <Film className={iconClass} />
      case 'Sports':
        return <Dumbbell className={iconClass} />
    }
  }

  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${
        selected
          ? 'border-red-500 bg-gradient-to-br from-red-500 to-rose-600 shadow-lg'
          : 'border-gray-200 bg-white hover:border-red-300 hover:shadow-md'
      }`}
    >
      <div className="mb-2">{getCategoryIcon(category)}</div>
      <div className={`font-semibold ${selected ? 'text-white' : 'text-gray-800'}`}>{category}</div>
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
  return (
    <button
      onClick={onClick}
      className={`px-8 py-3 rounded-lg font-semibold transition-all ${
        selected
          ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg'
          : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-red-300 hover:shadow-md'
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
          ? 'border-red-500 bg-red-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-red-300 hover:shadow-sm'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className={`font-medium ${selected ? 'text-red-900' : 'text-gray-900'}`}>{option}</div>
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
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="flex items-center justify-center px-4 py-12 sm:py-20">
          <div className="w-full max-w-4xl">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-4">
                Test Your Knowledge
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Challenge yourself with trivia questions across various topics and difficulty levels
              </p>
            </div>

            {/* Setup Card */}
            <Card className="border-gray-200 shadow-xl bg-white">
              <CardContent className="p-8 space-y-8">
                {/* Category Selection */}
                <div>
                  <h3 className="text-gray-900 font-bold mb-5 text-xl">Select Category</h3>
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

                <Separator className="bg-gray-200" />

                {/* Difficulty Selection */}
                <div>
                  <h3 className="text-gray-900 font-bold mb-5 text-xl">Select Difficulty</h3>
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
                  className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg text-lg py-6"
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
                  <div className="text-red-700 text-center p-3 bg-red-50 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Render question screen
  if (gameState === 'question' && response?.result) {
    const { question, score, commentary } = response.result

    return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="flex items-center justify-center px-4 py-8">
          <Card className="w-full max-w-3xl border-gray-200 shadow-xl bg-white">
            <CardHeader>
              {/* Score Display */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span className="text-gray-900 font-semibold">
                    Score: {score.correct}/{score.total}
                  </span>
                </div>
                <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 font-semibold">
                  {score.percentage}%
                </Badge>
              </div>

              {/* Progress Bar */}
              <Progress
                value={score.percentage}
                className="mb-4 bg-gray-200 [&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:to-rose-600"
              />

              <CardTitle className="text-2xl text-gray-900 leading-relaxed">{question?.text}</CardTitle>
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
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700 text-sm">{commentary}</p>
                  </div>
                </div>
              )}

              <Button
                onClick={submitAnswer}
                disabled={!selectedAnswer || loading}
                size="lg"
                className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg"
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
                <div className="text-red-700 text-center p-3 bg-red-50 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Render feedback screen
  if (gameState === 'feedback' && response?.result) {
    const { question, feedback, score, commentary } = response.result

    return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="flex items-center justify-center px-4 py-8">
          <Card className="w-full max-w-3xl border-gray-200 shadow-xl bg-white">
            <CardHeader>
              {/* Score Display */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span className="text-gray-900 font-semibold">
                    Score: {score.correct}/{score.total}
                  </span>
                </div>
                <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 font-semibold">
                  {score.percentage}%
                </Badge>
              </div>

              {/* Progress Bar */}
              <Progress
                value={score.percentage}
                className="mb-4 bg-gray-200 [&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:to-rose-600"
              />

              <CardTitle className="text-2xl text-gray-900 leading-relaxed">{question?.text}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Feedback */}
              {feedback && (
                <div>
                  <div className={`flex items-center gap-3 mb-4 p-4 rounded-lg shadow-md ${
                    feedback.is_correct
                      ? 'bg-green-50 border-2 border-green-400'
                      : 'bg-red-50 border-2 border-red-400'
                  }`}>
                    {feedback.is_correct ? (
                      <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
                    )}
                    <div>
                      <p className={`font-semibold text-lg ${
                        feedback.is_correct ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {feedback.message}
                      </p>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-blue-900 font-semibold mb-2">Explanation</h4>
                    <p className="text-gray-700">{feedback.explanation}</p>
                  </div>
                </div>
              )}

              {/* Correct Answer */}
              {question && (
                <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
                  <p className="text-gray-600 text-sm mb-1">Correct Answer:</p>
                  <p className="text-green-700 font-semibold">
                    {question.options.find(opt => opt.startsWith(question.correct_answer))}
                  </p>
                </div>
              )}

              {/* Commentary */}
              {commentary && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700 text-sm">{commentary}</p>
                  </div>
                </div>
              )}

              <Button
                onClick={nextQuestion}
                disabled={loading}
                size="lg"
                className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg"
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
                <div className="text-red-700 text-center p-3 bg-red-50 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Render game over screen
  if (gameState === 'game_over' && response?.result) {
    const { score, commentary } = response.result

    let performanceMessage = ''
    let performanceColor = ''
    let performanceBg = ''

    if (score.percentage >= 80) {
      performanceMessage = 'Outstanding Performance!'
      performanceColor = 'text-green-600'
      performanceBg = 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
    } else if (score.percentage >= 60) {
      performanceMessage = 'Good Job!'
      performanceColor = 'text-blue-600'
      performanceBg = 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300'
    } else if (score.percentage >= 40) {
      performanceMessage = 'Nice Try!'
      performanceColor = 'text-amber-600'
      performanceBg = 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300'
    } else {
      performanceMessage = 'Keep Practicing!'
      performanceColor = 'text-orange-600'
      performanceBg = 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-300'
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-2xl border-gray-200 shadow-xl bg-white">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Trophy className="h-16 w-16 text-amber-500" />
              </div>
              <CardTitle className="text-4xl text-gray-900 mb-2">Game Over!</CardTitle>
              <CardDescription className={`text-2xl font-semibold ${performanceColor}`}>
                {performanceMessage}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Final Score */}
              <div className={`text-center p-8 ${performanceBg} rounded-xl border-2 shadow-lg`}>
                <p className="text-gray-700 text-lg mb-2">Final Score</p>
                <p className="text-6xl font-bold text-gray-900 mb-2">
                  {score.correct}/{score.total}
                </p>
                <p className={`text-3xl font-bold ${performanceColor}`}>{score.percentage}%</p>
              </div>

              {/* Commentary */}
              {commentary && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">{commentary}</p>
                  </div>
                </div>
              )}

              <Button
                onClick={playAgain}
                size="lg"
                className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg text-lg py-6"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Play Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Fallback/loading state
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-900 text-lg">Loading Trivia Master...</p>
        </div>
      </div>
    </div>
  )
}
