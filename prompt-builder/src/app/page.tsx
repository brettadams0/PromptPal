import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TASK_TYPES } from '@/lib/constants';
import { Sparkles, Zap, Target, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="container-responsive py-8">
      {/* Hero Section */}
      <section className="text-center py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Build Better AI Prompts with{' '}
            <span className="gradient-text">PromptPal</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Create high-quality prompts for ChatGPT, Claude, and other AI models with our intuitive prompt builder.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-3">
              <Sparkles className="mr-2 h-5 w-5" />
              Start Building
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              View Templates
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to create amazing prompts
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From simple text prompts to complex multi-step instructions, PromptPal has you covered.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Lightning Fast</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Generate prompts in seconds with our optimized templates and real-time preview.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>Precise Control</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Fine-tune every aspect of your prompts with advanced customization options.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-success" />
              </div>
              <CardTitle>Smart Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Choose from hundreds of pre-built templates designed for specific use cases.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-warning" />
              </div>
              <CardTitle>Community Driven</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Share and discover prompts from our growing community of AI enthusiasts.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Task Types Section */}
      <section className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Built for every type of task
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Whether you're writing, coding, analyzing, or creating, we have the perfect prompt templates for you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(TASK_TYPES).map(([key, task]) => (
            <Card key={key} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{task.icon}</span>
                  <CardTitle>{task.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{task.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to build your first prompt?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of users who are already creating better AI prompts with PromptPal.
          </p>
          <Button size="lg" className="text-lg px-8 py-3">
            Get Started Free
          </Button>
        </div>
      </section>
    </div>
  );
} 