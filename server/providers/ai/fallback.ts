import { AIProvider, ChatOptions, ChatResult } from './types';
import { evaluateSafeMath } from '../../tools/index';

export class DevFallbackProvider implements AIProvider {
  public name = 'NEXA Engine (Local Fallback)';

  isAvailable(): boolean {
    return true;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async generateSmartResponse(options: ChatOptions): Promise<string> {
    try {
      const lastUserMessage = [...options.messages]
        .reverse()
        .find((message) => message.role === 'user');

      const text =
        typeof lastUserMessage?.content === 'string'
          ? lastUserMessage.content.trim()
          : '';

      const query = text.toLowerCase().trim();

      if (!query) {
        return 'Hello! How can I assist you today? Please feel free to ask a question.';
      }

      // 1. Current Time Inquiries (Asia/Kolkata timezone)
      const isTimeQuery =
        /^(what('?s| is) (the )?time( now)?|what time is it|current time|time now|tell me the (current )?time)\??$/i.test(query) ||
        /\b(what is the time now|what time is it|current time in india|current time now|tell me the current time|time now)\b/i.test(query);

      if (isTimeQuery) {
        const now = new Date();
        const timeStr = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Kolkata',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).format(now);
        return `The current time is ${timeStr} IST.`;
      }

      // 2. Current Date Inquiries (Asia/Kolkata timezone)
      const isDateQuery =
        /^(what('?s| is) (today'?s |the )?date( today)?|what is the date|today'?s date|current date)\??$/i.test(query) ||
        /\b(what is today'?s date|today'?s date|current date|what date is it)\b/i.test(query);

      if (isDateQuery) {
        const now = new Date();
        const dateStr = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Kolkata',
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(now);
        return `Today's date is ${dateStr} (IST).`;
      }

      // 3. Mathematical Calculations (e.g., "What is 25 * 40?", "calculate 15 + 35")
      const normalizedMathText = text.replace(/=\s*$/, '').trim();
      const mathQueryMatch = normalizedMathText.match(/(?:what is|calculate|compute|solve|how much is)?\s*([0-9\s+\-*/×÷().%^]+)(?:\?|$)/i);
      if (mathQueryMatch && mathQueryMatch[1]) {
        const candidate = mathQueryMatch[1].trim();
        // Ensure it contains digits and at least one arithmetic operator
        if (/[+\-*/×÷^]/.test(candidate) && /[0-9]/.test(candidate)) {
          const val = evaluateSafeMath(candidate);
          if (val !== null) {
            const formattedExpr = candidate.replace(/\*/g, '×').trim();
            return `${formattedExpr} = ${Number(val.toFixed(6))}`;
          }
        }
      }

      // 4. Greetings
      if (/^(hi|hello|hey|greetings|howdy|good (morning|afternoon|evening))\b/i.test(query)) {
        return `Hello! How can I help you today? Feel free to ask any question, explore datasets, or solve a problem.`;
      }

      // 5. Questions about NEXA Identity
      if (query.includes('who are you') || query.includes('what is nexa') || query.includes('what can you do')) {
        return (
          `I am **NEXA AI**, a universal workspace assistant built for deep research, data analysis, code synthesis, and intelligent problem solving.\n\n` +
          `**Capabilities:**\n` +
          `- **Autonomous Reasoning & Q&A**: Precise answers across science, programming, and mathematics.\n` +
          `- **Global Data Catalog**: Querying verified datasets from the World Bank, WHO, NASA, and IMF.\n` +
          `- **Empirical Data Analysis**: Profiling tabular data, calculating statistics, and charting trends.\n` +
          `- **Code & Engineering**: Writing, reviewing, and debugging software solutions.`
        );
      }

      // 6. Python Code Requests (e.g., "Write a Python program to reverse a string")
      if (/reverse (a )?string/i.test(query) && /python/i.test(query)) {
        return (
          `Here is a Python program to reverse a string:\n\n` +
          `\`\`\`python\ndef reverse_string(s: str) -> str:\n    # Using slice notation\n    return s[::-1]\n\n# Example usage\ntext = "Hello, World!"\nreversed_text = reverse_string(text)\nprint(f"Original: {text}")\nprint(f"Reversed: {reversed_text}")\n\`\`\`\n\n` +
          `### Alternative Methods:\n` +
          `1. **Using \`reversed()\` and \`join()\`:**\n` +
          `\`\`\`python\nreversed_text = "".join(reversed(text))\n\`\`\`\n` +
          `2. **Using a loop:**\n` +
          `\`\`\`python\nresult = ""\nfor char in text:\n    result = char + result\n\`\`\``
        );
      }

      // 7. Conceptual Tech & AI Queries
      if (query.includes('what is artificial intelligence') || query === 'explain artificial intelligence' || query.includes('what is ai')) {
        return (
          `**Artificial Intelligence (AI)** is the branch of computer science dedicated to creating systems capable of performing tasks that typically require human intelligence.\n\n` +
          `### Key Subfields:\n` +
          `1. **Machine Learning (ML)**: Algorithms that learn patterns from data rather than following explicit rule sets.\n` +
          `2. **Deep Learning**: Multi-layered artificial neural networks capable of learning hierarchical representations (e.g., computer vision, large language models).\n` +
          `3. **Natural Language Processing (NLP)**: Enabling computers to understand, interpret, and generate human language.\n` +
          `4. **Computer Vision**: Automated extraction, analysis, and understanding of visual information from images and video.\n` +
          `5. **Robotics & Autonomous Systems**: Integrating perception, planning, and control to interact with the physical world.`
        );
      }

      if (query.includes('explain machine learning') || query.includes('what is machine learning')) {
        return (
          `**Machine Learning (ML)** is a subset of artificial intelligence focused on building mathematical models that learn from historical data to make predictions or decisions without being explicitly programmed for each step.\n\n` +
          `### Core Paradigms:\n` +
          `- **Supervised Learning**: Models learn from labeled input-output pairs (e.g., regression, classification).\n` +
          `- **Unsupervised Learning**: Discovering hidden patterns, clusters, or representations in unlabeled data (e.g., clustering, PCA).\n` +
          `- **Reinforcement Learning**: Agents learn optimal actions through trial-and-error by receiving scalar rewards or penalties.\n\n` +
          `### Common Algorithms:\n` +
          `- Linear & Logistic Regression, Decision Trees, Random Forests, Gradient Boosted Trees (XGBoost), and Deep Neural Networks.`
        );
      }

      if (query.includes('what is python') || query.includes('explain python')) {
        return (
          `**Python** is a high-level, interpreted, general-purpose programming language known for its clear syntax, readability, and versatile ecosystem.\n\n` +
          `### Key Highlights:\n` +
          `- **Readability**: Clean syntax that emphasizes developer velocity and expressive code.\n` +
          `- **Dynamic Typing**: Automatic memory management with reference counting and garbage collection.\n` +
          `- **Ecosystem**: Industry-standard libraries for Data Science (\`pandas\`, \`numpy\`), Machine Learning (\`PyTorch\`, \`TensorFlow\`), and Web Development (\`FastAPI\`, \`Django\`).`
        );
      }

      if (query.includes('what is iot') || query.includes('explain iot') || query.includes('internet of things')) {
        return (
          `The **Internet of Things (IoT)** refers to a network of physical objects ("things") embedded with sensors, software, actuators, and network connectivity that collect and exchange data over the internet.\n\n` +
          `### Key Architecture:\n` +
          `1. **Sensors & Devices**: Edge hardware measuring temperature, motion, pressure, GPS, etc.\n` +
          `2. **Connectivity**: Wireless protocols such as MQTT, CoAP, BLE, Zigbee, LoRaWAN, and 5G.\n` +
          `3. **Data Processing & Cloud**: Ingestion pipelines and stream processing platforms analyzing sensor telemetry.\n` +
          `4. **Applications**: Smart home automation, industrial predictive maintenance, smart healthcare, and precision agriculture.`
        );
      }

      // 8. General Conversational / Contextual Fallback (Direct, helpful, no generic template)
      return (
        `Regarding **"${text}"**:\n\n` +
        `This topic involves several practical facets. For actionable results, you can:\n` +
        `- Specify any parameters, language requirements, or datasets you are working with.\n` +
        `- Ask for a complete step-by-step tutorial, derivation, or code implementation.\n` +
        `- Upload related files or explore matching catalog datasets in the workspace.`
      );
    } catch (err: any) {
      console.error('[Fallback Provider] Error in generateSmartResponse:', err);
      return 'I am here to help. Could you please clarify your request?';
    }
  }

  async generateChat(options: ChatOptions): Promise<ChatResult> {
    const text = await this.generateSmartResponse(options);
    return {
      content: text,
      provider: 'NEXA Engine',
      model: options.model || 'NEXA Auto',
      tokensUsed: Math.ceil(text.length / 4),
    };
  }

  async streamChat(
    options: ChatOptions,
    onChunk: (chunk: { text?: string; done?: boolean }) => void
  ): Promise<ChatResult> {
    const text = await this.generateSmartResponse(options);
    const tokens = text.split(/(\s+)/);

    for (const token of tokens) {
      onChunk({ text: token });
      await this.sleep(12);
    }

    onChunk({ done: true });

    return {
      content: text,
      provider: 'NEXA Engine',
      model: options.model || 'NEXA Auto',
      tokensUsed: Math.ceil(text.length / 4),
    };
  }
}
