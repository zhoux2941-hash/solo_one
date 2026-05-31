import ReadabilityCards from "./ReadabilityCards";
import TextStats from "./TextStats";
import SyllableHighlight from "./SyllableHighlight";

export default function ResultPanel() {
  return (
    <div className="space-y-5 h-full overflow-y-auto pr-1">
      <ReadabilityCards />
      <TextStats />
      <SyllableHighlight />
    </div>
  );
}
