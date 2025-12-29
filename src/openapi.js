/**
 * OpenAPI Specification
 * Defines the REST API schema for ChatGPT Actions
 */

const config = require('./config');

function getOpenAPISpec() {
  return `openapi: 3.1.0
info:
  title: VGC Team Finder API
  description: |
    Search 6000+ competitive Pokemon VGC teams across 8 regulations (J, I, H, G, F, E, D, C).
    Find rental codes, check Pokemon usage statistics, discover teammates, and get team building inspiration.
    Data sourced from VGCPastes public repository.
  version: 2.0.0
  contact:
    name: VGC Team Finder
servers:
  - url: ${config.serverUrl}
    description: Production server
paths:
  /api/search:
    get:
      operationId: searchTeams
      summary: Search VGC teams
      description: |
        Search for teams by Pokemon, player name, event, or item.
        Use "and" to combine multiple Pokemon (e.g., "Incineroar and Flutter Mane").
        Optionally filter by regulation.
      parameters:
        - name: query
          in: query
          required: true
          schema:
            type: string
          description: Search query - Pokemon names, player, event, item. Use "and" for multiple terms.
          example: "Incineroar and Flutter Mane"
        - name: regulation
          in: query
          schema:
            type: string
            enum: [J, I, H, G, F, E, D, C]
          description: Filter by regulation (J is current, C is oldest)
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
          description: Number of results to return
      responses:
        '200':
          description: List of matching teams
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TeamSearchResponse'
  /api/random:
    get:
      operationId: getRandomTeam
      summary: Get a random VGC team
      description: Get a random team for inspiration. Filter by Pokemon or regulation.
      parameters:
        - name: pokemon
          in: query
          schema:
            type: string
          description: Filter to teams with this Pokemon
        - name: regulation
          in: query
          schema:
            type: string
            enum: [J, I, H, G, F, E, D, C]
          description: Filter by regulation
      responses:
        '200':
          description: A random team
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SingleTeamResponse'
  /api/rental/{code}:
    get:
      operationId: getRentalTeam
      summary: Look up a team by rental code
      description: Find a specific team using its 6-character rental code.
      parameters:
        - name: code
          in: path
          required: true
          schema:
            type: string
            pattern: "^[A-Z0-9]{6}$"
          description: The 6-character rental code
          example: "B49GQ9"
      responses:
        '200':
          description: The team with that rental code
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SingleTeamResponse'
  /api/usage:
    get:
      operationId: getPokemonUsage
      summary: Get Pokemon usage statistics
      description: Shows the most popular Pokemon across all teams. Filter by regulation.
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
          description: Number of Pokemon to show
        - name: regulation
          in: query
          schema:
            type: string
            enum: [J, I, H, G, F, E, D, C]
          description: Filter by regulation
      responses:
        '200':
          description: Usage statistics
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UsageResponse'
  /api/rentals:
    get:
      operationId: getRentalTeams
      summary: Get teams with rental codes
      description: Find teams that have rental codes available for immediate use in-game.
      parameters:
        - name: pokemon
          in: query
          schema:
            type: string
          description: Filter to rental teams with this Pokemon
        - name: regulation
          in: query
          schema:
            type: string
            enum: [J, I, H, G, F, E, D, C]
          description: Filter by regulation
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
          description: Number of results
      responses:
        '200':
          description: List of rental teams
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TeamSearchResponse'
  /api/regulations:
    get:
      operationId: getRegulations
      summary: Get available regulations
      description: List all available regulations and team counts for each.
      responses:
        '200':
          description: Regulation information
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RegulationsResponse'
  /api/teammates/{pokemon}:
    get:
      operationId: getPokemonTeammates
      summary: Get common teammates for a Pokemon
      description: Find the most common Pokemon paired with the specified Pokemon.
      parameters:
        - name: pokemon
          in: path
          required: true
          schema:
            type: string
          description: Pokemon name to find teammates for
          example: "Incineroar"
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
            maximum: 20
          description: Number of teammates to show
      responses:
        '200':
          description: List of common teammates
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TeammatesResponse'
  /api/items/{pokemon}:
    get:
      operationId: getPokemonItems
      summary: Get common items for a Pokemon
      description: Find the most common held items used on the specified Pokemon.
      parameters:
        - name: pokemon
          in: path
          required: true
          schema:
            type: string
          description: Pokemon name
          example: "Flutter Mane"
      responses:
        '200':
          description: List of common items
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ItemsResponse'
  /api/player/{name}:
    get:
      operationId: getPlayerTeams
      summary: Get teams by player
      description: Find all teams from a specific player.
      parameters:
        - name: name
          in: path
          required: true
          schema:
            type: string
          description: Player name to search for
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 50
          description: Number of results
      responses:
        '200':
          description: Player's teams
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TeamSearchResponse'
components:
  schemas:
    Pokemon:
      type: object
      properties:
        name:
          type: string
          description: Pokemon name
          example: "Incineroar"
        item:
          type: string
          description: Held item
          example: "Assault Vest"
        sprite:
          type: string
          description: URL to Pokemon sprite image
    Team:
      type: object
      properties:
        teamId:
          type: string
          description: Unique team identifier
          example: "J95"
        description:
          type: string
          description: Team description
        player:
          type: string
          description: Player/creator name
        pokemon:
          type: array
          items:
            $ref: '#/components/schemas/Pokemon'
          description: List of 6 Pokemon on the team
        pokepaste:
          type: string
          description: URL to full team details on Pokepaste
        rentalCode:
          type: string
          description: 6-character rental code for in-game use
        date:
          type: string
          description: Date the team was used/posted
        event:
          type: string
          description: Tournament or event name
        rank:
          type: string
          description: Placement at the event
        regulation:
          type: string
          description: VGC regulation (J, I, H, G, F, E, D, C)
    TeamSearchResponse:
      type: object
      properties:
        total:
          type: integer
          description: Total number of matching teams
        teams:
          type: array
          items:
            $ref: '#/components/schemas/Team'
    SingleTeamResponse:
      type: object
      properties:
        team:
          $ref: '#/components/schemas/Team'
    UsageResponse:
      type: object
      properties:
        totalTeams:
          type: integer
        usage:
          type: array
          items:
            type: object
            properties:
              name:
                type: string
              count:
                type: integer
              percentage:
                type: string
    RegulationsResponse:
      type: object
      properties:
        totalTeams:
          type: integer
        regulations:
          type: array
          items:
            type: object
            properties:
              name:
                type: string
              count:
                type: integer
    TeammatesResponse:
      type: object
      properties:
        pokemon:
          type: string
        totalTeams:
          type: integer
        teammates:
          type: array
          items:
            type: object
            properties:
              name:
                type: string
              count:
                type: integer
              percentage:
                type: string
    ItemsResponse:
      type: object
      properties:
        pokemon:
          type: string
        totalCount:
          type: integer
        items:
          type: array
          items:
            type: object
            properties:
              name:
                type: string
              count:
                type: integer
              percentage:
                type: string
`;
}

module.exports = { getOpenAPISpec };
