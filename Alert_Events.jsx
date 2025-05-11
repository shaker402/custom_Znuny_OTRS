import React, { useMemo } from "react";
import "./Alert_Events.css";

/**
 * Parses the "Body" of an article into readable HTML content.
 * @param {string} body - The raw HTML-like body of an article.
 * @returns {JSX.Element} - Parsed body content as safe HTML or a fallback message.
 */
const parseArticleBody = (body) => {
  try {
    return body ? (
      <div dangerouslySetInnerHTML={{ __html: body }} />
    ) : (
      <p>No body content available.</p>
    );
  } catch (error) {
    console.error("Failed to parse article body:", error);
    return <p>Malformed body content.</p>;
  }
};

const AlertEvents = ({ processTreeArticle, alertEventsArticle }) => {
  // Parse the body of each article
  const parsedProcessTreeBody = useMemo(() => parseArticleBody(processTreeArticle), [processTreeArticle]);
  const parsedAlertEventsBody = useMemo(() => parseArticleBody(alertEventsArticle), [alertEventsArticle]);

  return (
    <div className="alert-events">
      <section>
        <h3>Process Tree</h3>
        <div className="alert-events-body">
          {parsedProcessTreeBody}
        </div>
      </section>
      <section>
        <h3>Alerts & Events</h3>
        <div className="alert-events-body">
          {parsedAlertEventsBody}
        </div>
      </section>
    </div>
  );
};

export default AlertEvents;