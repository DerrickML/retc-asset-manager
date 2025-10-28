"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  assetEventsService,
  staffService,
} from "../../lib/appwrite/provider.js";
import { Query } from "appwrite";

export function ConsumableActivity({ consumableId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [consumableId]);

  const loadEvents = async () => {
    try {
      const result = await assetEventsService.list([
        Query.equal("assetId", consumableId),
        Query.orderDesc("at"),
        Query.limit(50),
      ]);

      // Load staff names for events
      const eventsWithStaff = await Promise.all(
        result.documents.map(async (event) => {
          try {
            const staff = await staffService.get(event.actorStaffId);
            return { ...event, actorName: staff.name };
          } catch {
            return { ...event, actorName: "Unknown User" };
          }
        })
      );

      setEvents(eventsWithStaff);
    } catch (error) {
      console.error("Failed to load consumable events:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatEventType = (eventType) => {
    return eventType
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getEventBadgeColor = (eventType) => {
    const colors = {
      CREATED: "bg-green-100 text-green-800",
      STATUS_CHANGED: "bg-blue-100 text-blue-800",
      STOCK_ADDED: "bg-emerald-100 text-emerald-800",
      STOCK_REDUCED: "bg-orange-100 text-orange-800",
      STOCK_ADJUSTED: "bg-yellow-100 text-yellow-800",
      DISTRIBUTED: "bg-purple-100 text-purple-800",
      RETURNED: "bg-cyan-100 text-cyan-800",
      REORDERED: "bg-indigo-100 text-indigo-800",
      EXPIRED: "bg-red-100 text-red-800",
    };
    return colors[eventType] || "bg-gray-100 text-gray-800";
  };

  const formatEventDetails = (event) => {
    const details = [];

    if (event.fromValue !== null && event.toValue !== null) {
      if (
        event.eventType === "STOCK_ADDED" ||
        event.eventType === "STOCK_REDUCED" ||
        event.eventType === "STOCK_ADJUSTED"
      ) {
        details.push(`Stock: ${event.fromValue} → ${event.toValue}`);
      } else if (event.eventType === "STATUS_CHANGED") {
        details.push(`Status: ${event.fromValue} → ${event.toValue}`);
      }
    }

    if (event.quantity !== null) {
      details.push(`Quantity: ${event.quantity}`);
    }

    if (event.notes) {
      details.push(`Notes: ${event.notes}`);
    }

    return details.join(" • ");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading events...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity History</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No activity records found for this consumable.
          </p>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.$id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge className={getEventBadgeColor(event.eventType)}>
                      {formatEventType(event.eventType)}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      by {event.actorName}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(event.at)}
                  </span>
                </div>

                {formatEventDetails(event) && (
                  <p className="text-sm text-gray-600 mt-2">
                    {formatEventDetails(event)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
