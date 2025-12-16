import { Message } from "@/hooks/useMessages";
import { Profile } from "@/hooks/useProfiles";

export interface GroupedMessage extends Message {
    isGrouped?: boolean;
    recipients?: Profile[]; // List of all recipients for this group
    recipientCount?: number;
    messageIds?: string[]; // IDs of all messages in this group
}

/**
 * Groups sent messages that have the same subject, body, and close creation time.
 * This simulates a "Broadcast" view where one action sent to multiple people is shown as one row.
 */
export function groupSentMessages(messages: Message[]): GroupedMessage[] {
    if (!messages || messages.length === 0) return [];

    const groups: GroupedMessage[] = [];
    const processedIds = new Set<string>();

    // Sort by date DESC just in case
    const sorted = [...messages].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    for (let i = 0; i < sorted.length; i++) {
        const current = sorted[i];
        if (processedIds.has(current.id)) continue;

        // Start a new group with this message
        const group: GroupedMessage = {
            ...current,
            isGrouped: true,
            recipients: current.to_profile ? [current.to_profile as Profile] : [],
            recipientCount: 1,
            messageIds: [current.id],
        };

        processedIds.add(current.id);

        // Look ahead for matches
        // We only look at subsequent messages (which are older or same time)
        // We limit look-ahead to avoid O(N^2) on huge lists, but for a user inbox it's usually fine.
        // For "same send action", created_at should be very close (e.g. within 2 seconds).
        const currentTime = new Date(current.created_at).getTime();

        for (let j = i + 1; j < sorted.length; j++) {
            const candidate = sorted[j];
            if (processedIds.has(candidate.id)) continue;

            const candidateTime = new Date(candidate.created_at).getTime();
            const timeDiff = Math.abs(currentTime - candidateTime);

            // Criteria:
            // 1. Same Subject
            // 2. Same Body
            // 3. Created within 60 seconds (generous window for batch processing delay)
            if (
                timeDiff <= 60000 &&
                candidate.subject === current.subject &&
                candidate.body === current.body
            ) {
                // Add to group
                if (candidate.to_profile) {
                    group.recipients?.push(candidate.to_profile as Profile);
                }
                group.recipientCount = (group.recipientCount || 0) + 1;
                group.messageIds?.push(candidate.id);
                processedIds.add(candidate.id);
            } else if (timeDiff > 60000) {
                // Since sorted by date, if diff exceeds window, no further matches likely (for this specific batch)
                // Optimization: break loop? Not necessarily, user might have sent same message later manually.
                // But requirement implies "one sent action".
                // Let's assume > 1 min diff means different action.
                // But we must continue loop to process other messages for THEIR groups.
                // So we just don't add to THIS group.
            }
        }

        groups.push(group);
    }

    return groups;
}
