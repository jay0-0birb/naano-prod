import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getClientIP } from "@/lib/get-client-ip";

interface IpApiResponse {
  status: "success" | "fail";
  country?: string;
  countryCode?: string;
  city?: string;
  zip?: string;
  message?: string;
}

export async function GET(_req: NextRequest) {
  try {
    const hdrs = await headers();
    const ipAddress = getClientIP(hdrs);

    if (!ipAddress || ipAddress === "local") {
      return NextResponse.json(
        { success: false, error: "LOCAL_IP" },
        { status: 400 },
      );
    }

    const response = await fetch(
      `http://ip-api.com/json/${ipAddress}?fields=status,country,countryCode,city,zip,message`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        // Do not cache – we want fresh location per request
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "UPSTREAM_ERROR" },
        { status: 502 },
      );
    }

    const data = (await response.json()) as IpApiResponse;

    if (data.status !== "success") {
      return NextResponse.json(
        {
          success: false,
          error: data.message || "LOOKUP_FAILED",
        },
        { status: 400 },
      );
    }

    const country =
      data.country ||
      (data.countryCode
        ? // Simple mapping for common codes when full name missing
          data.countryCode
        : null);

    return NextResponse.json({
      success: true,
      ip: ipAddress,
      country,
      countryCode: data.countryCode ?? null,
      city: data.city ?? null,
      postalCode: data.zip ?? null,
    });
  } catch (error) {
    console.error("Error detecting address from IP:", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

