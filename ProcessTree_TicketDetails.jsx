import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Tree from "react-d3-tree"; // For rendering tree diagrams
import "./ProcessTree_TicketDetails.css"; // Custom styles for the graph and sidebar

const ProcessTree = ({ processTreeData }) => {
    const [treeData, setTreeData] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);

    console.log("Received processTreeData in ProcessTree:", processTreeData); // Debug log for received data

    // Helper function to parse raw HTML data into a hierarchical JSON structure
    const parseProcessTreeData = (articleBody) => {
        const processRegex = /<b>Timestamp:<\/b> (.*?)<br><b>Process:<\/b> (.*?) \(PID: (.*?)\)<br><b>Command Line:<\/b> (.*?)<br><b>SHA256:<\/b> (.*?)<br><b>Message:<\/b> (.*?)<br><b>Score:<\/b> (.*?)<br><b>Popular Threat Label:<\/b> (.*?)<br><b>File Report:<\/b>\s*<a href='(.*?)' target='_blank'>Link<\/a><br>.*?<b>Behavior:<\/b><br>\s{2}Sigma Rules: (.*?)<br>\s{2}IDS Rules: (.*?)<br>/gs;
        let match;
        const processes = [];

        while ((match = processRegex.exec(articleBody)) !== null) {
            processes.push({
                timestamp: match[1],
                processName: match[2],
                pid: match[3],
                commandLine: match[4],
                sha256: match[5],
                message: match[6],
                score: match[7],
                popularThreatLabel: match[8],
                fileReport: match[9],
                behavior: {
                    sigmaRules: match[10],
                    idsRules: match[11],
                },
            });
        }

        console.log("Parsed Processes:", processes); // Debug log for parsed processes

        // Build the hierarchical tree structure
        const buildTree = (index) => {
            if (index >= processes.length) return null;

            const currentProcess = processes[index];
            const children = buildTree(index + 1);

            return {
                name: `${currentProcess.processName} - ${currentProcess.timestamp}`,
                attributes: {
                    ...currentProcess,
                },
                children: children ? [children] : [],
            };
        };

        return buildTree(0);
    };

    useEffect(() => {
        const parsedData = parseProcessTreeData(processTreeData);
        console.log("Parsed treeData:", parsedData); // Debug log for parsed tree data
        setTreeData(parsedData);
    }, [processTreeData]);

    const handleNodeClick = (nodeData) => {
        console.log("Node clicked:", nodeData); // Debug log for the clicked node
        setSelectedNode(nodeData);
    };

    return (
        <div className="process-tree-container">
            <div className="tree-graph" style={{ flex: 3, borderRight: "1px solid #ddd" }}>
                {treeData && (
                    <Tree
                        data={treeData}
                        orientation="vertical"
                        translate={{ x: 300, y: 50 }}
                        zoomable
                        collapsible={false}
                        pathFunc="elbow" // Use elbow path function for slanted lines
                        nodeSize={{ x: 300, y: 150 }}
                        onClick={handleNodeClick}
                        renderCustomNodeElement={({ nodeDatum }) => (
                            <g>
                                {/* Node Circle */}
                                <circle r={15} fill="#1f77b4" />
                                {/* Node Name */}
                                <text
                                    x="20"
                                    y="5"
                                    fill="black"
                                    fontWeight="normal" // Adjust font weight to normal for readability
                                    fontSize="18px" // Increase font size for better readability
                                    style={{ cursor: "pointer", textDecoration: "underline" }}
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent triggering Tree's onClick
                                        handleNodeClick(nodeDatum);
                                    }}
                                >
                                    {nodeDatum.name}
                                </text>
                            </g>
                        )}
                        styles={{
                            links: { stroke: "#9CA3AF", strokeWidth: 2 },
                        }}
                    />
                )}
            </div>
            <div
                className="sidebar"
                style={{
                    flex: 1,
                    padding: "20px",
                    backgroundColor: "#f9f9f9",
                    overflowWrap: "break-word", // Wrap long text
                    wordWrap: "break-word", // Support older browsers
                    wordBreak: "break-word", // Ensure word breaking
                }}
            >
                <h3>Process Details</h3>
                {selectedNode ? (
                    <div>
                        <p>
                            <strong>Timestamp:</strong> {selectedNode.attributes?.timestamp}
                        </p>
                        <p>
                            <strong>Process Name:</strong> {selectedNode.attributes?.processName}
                        </p>
                        <p>
                            <strong>Command Line:</strong> {selectedNode.attributes?.commandLine}
                        </p>
                        <p>
                            <strong>SHA256:</strong> {selectedNode.attributes?.sha256}
                        </p>
                        <p>
                            <strong>Message:</strong> {selectedNode.attributes?.message}
                        </p>
                        <p>
                            <strong>Score:</strong> {selectedNode.attributes?.score}
                        </p>
                        <p>
                            <strong>Popular Threat Label:</strong> {selectedNode.attributes?.popularThreatLabel}
                        </p>
                        <p>
                            <strong>File Report:</strong>{" "}
                            <a href={selectedNode.attributes?.fileReport} target="_blank" rel="noopener noreferrer">
                                {selectedNode.attributes?.fileReport ? "Link" : "N/A"}
                            </a>
                        </p>
                        <p>
                            <strong>Behavior:</strong>
                        </p>
                        <ul>
                            <li>
                                <strong>Sigma Rules:</strong> {selectedNode.attributes?.behavior?.sigmaRules}
                            </li>
                            <li>
                                <strong>IDS Rules:</strong> {selectedNode.attributes?.behavior?.idsRules}
                            </li>
                        </ul>
                    </div>
                ) : (
                    <p>Select a node to view details</p>
                )}
            </div>
        </div>
    );
};

ProcessTree.propTypes = {
    processTreeData: PropTypes.string.isRequired,
};

export default ProcessTree;