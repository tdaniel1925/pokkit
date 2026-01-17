import { NextRequest, NextResponse } from "next/server";
// import { db, citizens, citizenMemories, citizenBeliefs } from "@/db";
// import { eq } from "drizzle-orm";

/**
 * GET /api/citizen/[citizenId]
 * Get detailed citizen information including memories and beliefs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ citizenId: string }> }
) {
  try {
    const { citizenId } = await params;

    // TODO: Implement database query
    // const citizen = await db.query.citizens.findFirst({
    //   where: eq(citizens.id, citizenId),
    //   with: {
    //     beliefs: true,
    //     memories: {
    //       limit: 50,
    //       orderBy: desc(citizenMemories.tick),
    //     },
    //   },
    // });
    //
    // if (!citizen) {
    //   return NextResponse.json({ error: "Citizen not found" }, { status: 404 });
    // }

    // Return mock data for now
    return NextResponse.json({
      citizen: {
        id: citizenId,
        name: "Demo Citizen",
        attributes: {
          personalityArchetype: "seeker",
          emotionalSensitivity: 0.6,
          authorityTrustBias: 0.2,
          socialInfluencePotential: 0.5,
          curiosityAboutDivinity: 0.8,
        },
        state: {
          mood: 0.4,
          stress: 0.2,
          hope: 0.6,
          trustInPeers: 0.5,
          trustInGod: 0.3,
          cognitiveDissonance: 0.1,
        },
        consent: {
          emotionalConsent: 0.6,
          relationalPacingLimit: 0.5,
          authorityResistanceCurve: 0.5,
        },
      },
      beliefs: [],
      memories: [],
    });
  } catch (error) {
    console.error("Failed to get citizen:", error);
    return NextResponse.json(
      { error: "Failed to get citizen" },
      { status: 500 }
    );
  }
}
