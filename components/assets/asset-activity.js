"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  assetEventsService,
  staffService,
} from "../../lib/appwrite/provider.js";

export function AssetActivity({ assetId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId]);

  const loadEvents = async () => {
    try {
      const result = await assetEventsService.getByAssetId(assetId);

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
      console.error("Failed to load asset events:", error);
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
      CONDITION_CHANGED: "bg-yellow-100 text-yellow-800",
      ASSIGNED: "bg-purple-100 text-purple-800",
      RETURNED: "bg-indigo-100 text-indigo-800",
      LOCATION_CHANGED: "bg-orange-100 text-orange-800",
      RETIRED: "bg-gray-100 text-gray-800",
      DISPOSED: "bg-red-100 text-red-800",
    };
    return colors[eventType] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
                <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No activity recorded for this asset.
          </p>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.$id}
                className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-b-0"
              >
                <Badge className={getEventBadgeColor(event.eventType)}>
                  {formatEventType(event.eventType)}
                </Badge>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {event.actorName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(event.at)}
                    </p>
                  </div>

                  {event.notes && (
                    <p className="text-sm text-gray-600 mt-1">{event.notes}</p>
                  )}

                  {(event.fromValue || event.toValue) && (
                    <div className="text-xs text-gray-500 mt-1">
                      {event.fromValue && event.toValue ? (
                        <span>
                          Changed from{" "}
                          <strong>
                            {typeof event.fromValue === "object"
                              ? JSON.stringify(event.fromValue)
                              : event.fromValue}
                          </strong>{" "}
                          to{" "}
                          <strong>
                            {typeof event.toValue === "object"
                              ? JSON.stringify(event.toValue)
                              : event.toValue}
                          </strong>
                        </span>
                      ) : event.toValue ? (
                        <span>
                          Set to{" "}
                          <strong>
                            {typeof event.toValue === "object"
                              ? JSON.stringify(event.toValue)
                              : event.toValue}
                          </strong>
                        </span>
                      ) : (
                        <span>
                          Previous value:{" "}
                          <strong>
                            {typeof event.fromValue === "object"
                              ? JSON.stringify(event.fromValue)
                              : event.fromValue}
                          </strong>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
