# replit.md

## Overview

This is a Node.js Express server that functions as an MCP (Model Context Protocol) server. It fetches team data from a Google Sheets CSV export and exposes it through an API. The server includes Server-Sent Events (SSE) support for real-time communication and an MCP endpoint for tool-based interactions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Framework
- **Express 5.x** serves as the web framework
- Single-file architecture with all logic contained in `index.js`
- No frontend - this is a pure API/backend service

### Data Source
- Team data is fetched from a public Google Sheets document exported as CSV
- The `csv-parse` library handles CSV parsing with column headers
- Data is stored in memory (the `teams` array) after fetching

### Communication Patterns
- **SSE Endpoint (`/sse`)**: Implements Server-Sent Events for real-time, persistent connections with 30-second keepalive pings
- **MCP Endpoint (`/mcp`)**: POST endpoint implementing the Model Context Protocol for tool-based AI interactions
- The MCP implementation currently handles the `initialize` method and advertises tool capabilities

### Design Decisions
1. **In-memory data storage**: Team data is cached in memory rather than using a database, suitable for read-heavy workloads with infrequent updates
2. **External CSV source**: Uses Google Sheets as a simple, no-infrastructure data backend that non-technical users can update
3. **MCP Protocol**: Designed to integrate with AI agents/assistants that support the Model Context Protocol

## External Dependencies

### NPM Packages
- **express** (v5.2.1): Web server framework
- **axios** (v1.13.2): HTTP client for fetching CSV data
- **csv-parse** (v6.1.0): CSV parsing library

### External Services
- **Google Sheets**: Source of team data via public CSV export URL
  - URL pattern: `docs.google.com/spreadsheets/d/e/.../pub?output=csv`
  - The spreadsheet must be published to the web for access

### No Database
- Currently no database integration - all data is fetched from external CSV and held in memory