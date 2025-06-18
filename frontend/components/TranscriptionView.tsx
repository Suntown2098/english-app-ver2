import useCombinedTranscriptions from "@/hooks/useCombinedTranscriptions";
import * as React from "react";

export default function TranscriptionView() {
  const combinedTranscriptions = useCombinedTranscriptions();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [definition, setDefinition] = React.useState<string | null>(null);
  const [definitionWord, setDefinitionWord] = React.useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = React.useState<{x: number, y: number} | null>(null);


  // For highlight-translate feature
  const [selectedText, setSelectedText] = React.useState<string | null>(null);
  const [highlightTranslation, setHighlightTranslation] = React.useState<string | null>(null);
  // const [showTranslateBtn, setShowTranslateBtn] = React.useState(false);

  // scroll to bottom when new transcription is added
  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [combinedTranscriptions]);

  // Group user segments into a single bubble until an assistant segment appears
  const groupedMessages = [];
  let currentUserBubble = null;

  for (const segment of combinedTranscriptions) {
    if (segment.role === "assistant") {
      if (currentUserBubble) {
        groupedMessages.push(currentUserBubble);
        currentUserBubble = null;
      }
      groupedMessages.push(segment);
    } else {
      if (currentUserBubble) {
        currentUserBubble.text += " " + segment.text;
      } else {
        currentUserBubble = { ...segment };
      }
    }
  }
  if (currentUserBubble) {
    groupedMessages.push(currentUserBubble);
  }


  // =============== Definition lookup ===============
  // Double-click handler for word definition lookup
  function handleDoubleClickDefinition(e: React.MouseEvent) {
    const selection = window.getSelection();
    const word = selection && selection.toString().trim();
    if (word) {
      lookupDefinition(word, e);
      setSelectedText(null); // Clear translation state
      setHighlightTranslation(null);
    }
  }

  // Dictionary lookup (Glosbe API or similar)
  async function lookupDefinition(word: string, event: React.MouseEvent) {
    setDefinition(null);
    setDefinitionWord(word);
    setTooltipPos({ x: event.clientX, y: event.clientY });
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.meanings?.[0]?.definitions?.[0]?.definition) {
        setDefinition(data[0].meanings[0].definitions[0].definition);
      } else {
        setDefinition("No definition found.");
      }
    } catch {
      setDefinition("No definition found.");
    }
  }

  // =============== Translation (Direct Google API Call) ===============
  async function translateText(text: string) {
    if (!text.trim()) return;
      setHighlightTranslation("translating...");
      try {
        const apiKey = "AIzaSyCml_EpUm9LeR1Y2aa6XLml_sAxqIvuSdE"; 
        const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            q: text,
            source: "en",
            target: "vi",
            format: "text",
          }),
        });
        const data = await res.json();
        console.log("data", data);
        setHighlightTranslation(
          data?.data?.translations?.[0]?.translatedText || "Translation failed."
        );
      } catch {
        setHighlightTranslation("Translation failed.");
      }
  }


  // Highlight event handler
  function handleMouseUp(e: React.MouseEvent) {
    const selection = window.getSelection();
    const selected = selection && selection.toString().trim();
    if (selected && selected.split(/\s+/).length > 1) { // Only for multi-word selection
      setSelectedText(selected);
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setTooltipPos({ x: rect.right, y: rect.top });
    } else {
      setSelectedText(null);
      setHighlightTranslation(null);
    }
  }

  // Translate when selectedText changes or double-clicked on a word
  React.useEffect(() => {
    if (selectedText) {
      translateText(selectedText);
    } else {
      setHighlightTranslation(null);
    }
  }, [selectedText]);

  return (
    <div className="relative h-[512px] w-[1000px] max-w-[90vw] mx-auto">
      {/* Scrollable content */}
      <div
        ref={containerRef}
        className="overflow-y-auto flex-1 h-full flex flex-col gap-4 px-2 py-4 scrollbar-none hide-scrollbar bg-transparent"
        style={{ scrollbarWidth: 'none', background: 'transparent' }}
        onMouseUp={handleMouseUp}
      >
        {groupedMessages.map((segment, idx) => {
          const isUser = segment.role !== "assistant";
          const words = segment.text.split(/(\s+)/);
          return (
            <div
              id={segment.id ?? String(idx)}
              key={segment.id ?? String(idx)}
              className={`flex items-end ${isUser ? "justify-end" : "justify-start"}`}
            >
              {/* Assistant (left) */}
              {!isUser && (
                <div className="mr-2 flex-shrink-0">
                  <span className="w-8 h-8 flex items-center justify-center text-xl">🤖</span>
                </div>
              )}
              <div
                className={`rounded-3xl px-5 py-3 shadow-md text-base font-medium max-w-[70%] break-words flex flex-col ${
                  isUser
                    ? "bg-olive text-white"
                    : "bg-cream text-black"
                } ${isUser ? "ml-2" : "mr-2"}`}
                onDoubleClick={handleDoubleClickDefinition}
              >
                {segment.text}
              </div>
              {/* User (right) */}
              {isUser && (
                <div className="ml-2 flex-shrink-0">
                  <span className="w-8 h-8 flex items-center justify-center text-xl">🔥</span>
                </div>
              )}
            </div>
          );
        })}
        {/* Definition tooltip/modal */}
        {definition && definitionWord && tooltipPos && (
          <>
            {/* Overlay to close tooltip on click anywhere */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setDefinition(null)}
              style={{ background: 'transparent' }}
            />
            <div
              className="fixed z-50 bg-white border border-gray-300 rounded shadow-lg p-3 text-sm text-black"
              style={{ left: tooltipPos.x + 10, top: tooltipPos.y + 10 }}
            >
              <b>{definitionWord}</b>: {definition}
            </div>
          </>
        )}
        {/* Highlight translation button and result */}
        {selectedText && tooltipPos && highlightTranslation && (
          <div
            className="fixed z-50"
            style={{ left: tooltipPos.x + 10, top: tooltipPos.y + 10 }}
          >
            <div className="fixed z-50 bg-white border border-gray-300 rounded shadow-lg p-3 text-sm text-black">
              {highlightTranslation}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
