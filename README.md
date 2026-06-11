# JimatJourney 🛣️

## 📖 Overview
JimatJourney is an intelligent, graph-based routing application developed for our Discrete Structure Group 4 project. It calculates the optimal driving route between an origin and a destination anywhere in Peninsular Malaysia by actively balancing **travel time** and **toll costs**.

## 🎯 What is it for?
The application helps users find the most cost-effective and time-efficient driving routes based on their current priorities. While standard GPS apps (like Google Maps or Waze) usually default to the fastest highway route regardless of expensive toll costs, JimatJourney explicitly calculates whether paying a toll is mathematically "worth it". Users can toggle between **Time Mode** (prioritize speed) and **Budget Mode** (prioritize saving money).

## 🧮 Concept & Calculations
At its core, JimatJourney is a real-world implementation of **Dijkstra's Algorithm** and **Depth First Search (DFS)** running on a custom Weighted Graph. 

Unlike traditional shortest-path algorithms that only optimize for distance, our engine uses a composite **Weight (W)** formula for every road (edge):
> **W = Time + (Toll × β) + Penalty**

### What is Beta (β)?
Beta (β) acts as the **Toll Conversion Rate**. It translates monetary cost (RM) into an equivalent time cost (Minutes) so the algorithm can compare them fairly.
- **Time Mode (β = 0.5):** Every RM 1.00 is treated like only 0.5 minutes of extra driving. The algorithm happily pays tolls because the mathematical penalty for spending money is very low.
- **Budget Mode (β = 2.5):** Every RM 1.00 is heavily penalized as 2.5 minutes of extra driving. The algorithm avoids expensive highways and actively seeks free federal or local roads because the toll "costs" too much time mathematically.

### What is Penalty?
Penalty is a **Real-World Inconvenience Score** (measured in arbitrary minutes). A federal route and a highway might technically both take 30 minutes, but the federal route has traffic lights, speed bumps, and school zones. We add a static `penaltyMin` to non-highway edges to mathematically teach the algorithm that these roads are more tedious to drive on, subtly encouraging highway usage when times are equal.

## 🔌 APIs Used
1. **Google Gemini API (`gemini-2.5-flash`)**: Acts as our intelligent graph-generator. When a user searches for an un-hardcoded route, Gemini dynamically generates a realistic JSON graph of junctions and edges connecting the origin to the destination.
2. **OSRM (Open Source Routing Machine)**: Used to fetch real-world road geometries (polylines), accurate driving distances, and durations for drawing the exact road shapes on the map.
3. **MapTiler**: Provides the beautiful, high-performance base map tiles rendered underneath our routes.
4. **Google Geocoding API**: Resolves arbitrary user string inputs into precise latitude and longitude coordinates.

## 🏗️ System Architecture
JimatJourney is built as a modern, full-stack web application using **Next.js 16 (App Router)** and **TypeScript**.

1. **Frontend Layer (React & Tailwind CSS)**: 
   - A highly responsive, mobile-first interface featuring dynamic bottom-sheets and sidebars.
   - Interactive map rendered using `react-map-gl` and MapLibre.
2. **Graph Theory Engine (TypeScript)**:
   - Contains our custom `dijkstra.ts` implementation.
   - Utilizes DFS (Depth First Search) to traverse all valid paths between the Origin and Destination up to a depth limit, calculates their `ΣW`, and sorts them to find the "Recommended" route.
3. **AI Graph Generation Pipeline**:
   - Takes the user's requested Origin/Destination and securely pings Gemini API natively via REST.
   - Parses the JSON output to construct a valid `WeightedGraph` object containing nodes and edges on the fly.
4. **Real-World Geometry Mapper**:
   - Takes the theoretical graph path (e.g., Node A -> Node B) and passes the coordinates to OSRM to get the exact road curves to draw on the map perfectly.
