import { WebClient } from '@slack/web-api';

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function sendTaskAssignmentNotification(
  assignedToSlackUserId: string,
  assignedToName: string,
  taskTitle: string,
  dueDate?: string
) {
  try {
    const dueDateStr = dueDate ? ` (마감: ${new Date(dueDate).toLocaleDateString('ko-KR')})` : '';
    const message = `🎯 <@${assignedToSlackUserId}>에게 새로운 할일이 배정되었습니다!\n\n*${taskTitle}*${dueDateStr}`;

    // Direct Message로 전송
    const result = await slackClient.chat.postMessage({
      channel: assignedToSlackUserId,
      text: message,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '확인하러 가기',
              },
              url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
              action_id: 'view_task',
            },
          ],
        },
      ],
    });

    console.log('✓ Slack notification sent:', result.ts);
    return result;
  } catch (error) {
    console.error('Slack notification error:', error);
    throw error;
  }
}

export async function sendDueReminder(
  slackUserId: string,
  taskTitle: string,
  daysLeft: number
) {
  try {
    let emoji = '⏰';
    let message = '';

    if (daysLeft === 1) {
      emoji = '⚠️';
      message = `${emoji} 내일 마감입니다!\n*${taskTitle}*`;
    } else if (daysLeft <= 0) {
      emoji = '🚨';
      message = `${emoji} 마감이 지났습니다!\n*${taskTitle}*`;
    } else {
      message = `${emoji} ${daysLeft}일 남았습니다.\n*${taskTitle}*`;
    }

    await slackClient.chat.postMessage({
      channel: slackUserId,
      text: message,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message,
          },
        },
      ],
    });

    console.log(`✓ Due reminder sent to ${slackUserId}`);
  } catch (error) {
    console.error('Slack reminder error:', error);
    throw error;
  }
}

export async function getSlackUserList() {
  try {
    const result = await slackClient.users.list({});
    return result.members?.map(user => ({
      id: user.id,
      name: user.name,
      real_name: user.real_name,
      email: user.profile?.email,
    }));
  } catch (error) {
    console.error('Failed to get Slack user list:', error);
    throw error;
  }
}

export async function getUserIdFromSlackName(slackName: string): Promise<string | null> {
  try {
    // @name 형식 처리
    const cleanName = slackName.replace(/^@/, '').toLowerCase();

    const result = await slackClient.users.lookupByEmail({
      email: cleanName, // 이메일이 아니면 실패하므로 별도 처리 필요
    });

    return result.user?.id || null;
  } catch (error) {
    // 사용자를 찾지 못한 경우
    console.warn(`Could not find Slack user: ${slackName}`);
    return null;
  }
}

export default slackClient;
