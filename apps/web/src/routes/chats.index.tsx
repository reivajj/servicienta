import { createFileRoute } from '@tanstack/react-router';
import { RequireAuth } from '../features/auth/components/RequireAuth';
import { ChatConversationsPage } from '../features/chat/components/ChatConversationsPage';

export const Route = createFileRoute('/chats/')({
  component: ChatsRoute,
});

function ChatsRoute() {
  return (
    <RequireAuth>
      <ChatConversationsPage />
    </RequireAuth>
  );
}
