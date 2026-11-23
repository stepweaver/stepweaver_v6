<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { registerSharedChatDraft } from '$lib/chat/shared-draft';
	import LambdaText from '$lib/components/site/LambdaText.svelte';

	type Turn = { role: 'user' | 'assistant'; content: string; error?: boolean };

	let open = $state(false);
	let draft = $state('');
	let turns = $state<Turn[]>([]);
	let sending = $state(false);
	let ready = $state(false);
	let field = $state<HTMLInputElement | null>(null);

	function showDraft(next: string) {
		open = true;
		draft = next;
		void tick().then(() => field?.focus());
	}

	onMount(() => {
		ready = true;
		return registerSharedChatDraft(showDraft);
	});

	async function send() {
		const message = draft.trim();
		if (!message || sending) return;
		draft = '';
		turns = [...turns, { role: 'user', content: message }];
		sending = true;
		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					channel: 'widget',
					messages: turns
						.filter((turn) => !turn.error)
						.slice(-8)
						.map((turn) => ({ role: turn.role, content: turn.content }))
				})
			});
			const data = (await response.json()) as { message?: string; error?: string };
			if (!response.ok || !data.message) {
				turns = [
					...turns,
					{
						role: 'assistant',
						content: data.error || 'λlambda could not reach the model. This chat is still open.',
						error: true
					}
				];
				return;
			}
			turns = [...turns, { role: 'assistant', content: data.message }];
		} catch {
			turns = [
				...turns,
				{
					role: 'assistant',
					content: 'λlambda could not reach the model. This chat is still open.',
					error: true
				}
			];
		} finally {
			sending = false;
		}
	}
</script>

{#if open}
	<section class="chat" aria-label="λlambda chat">
		<header>
			<p><LambdaText text="λlambda" /></p>
			<button type="button" onclick={() => (open = false)}>Minimize</button>
		</header>
		<div class="thread" role="log" aria-label="Chat">
			{#if turns.length === 0}
				<p class="hint">Ask about the public site. λlambda is an assistant, not Stephen.</p>
			{/if}
			{#each turns as turn, index (`${index}-${turn.role}`)}
				<p class:error={turn.error} class:user={turn.role === 'user'}>{turn.content}</p>
			{/each}
		</div>
		<form
			onsubmit={(event) => {
				event.preventDefault();
				void send();
			}}
		>
			<label>
				Message
				<input bind:this={field} bind:value={draft} autocomplete="off" maxlength="2000" />
			</label>
			<button type="submit" disabled={sending || !draft.trim()}
				>{sending ? 'Sending' : 'Send'}</button
			>
		</form>
	</section>
{:else}
	<button
		type="button"
		class="open"
		data-ready={ready ? 'true' : 'false'}
		onclick={() => (open = true)}>Open chat</button
	>
{/if}

<style>
	.open,
	.chat {
		position: fixed;
		inset-inline-start: 0.75rem;
		inset-block-end: 0.75rem;
		z-index: 25;
		border: 1px solid var(--border-muted);
		border-radius: 0;
		background: color-mix(in oklab, var(--panel) 92%, black);
		color: var(--text);
		font-family: var(--font-family-ibm);
	}

	.open,
	button,
	input {
		min-block-size: 2.75rem;
		border: 1px solid var(--border-muted);
		border-radius: 0;
		background: transparent;
		color: var(--text);
		font-family: var(--font-family-ibm);
		font-size: 1rem;
	}

	.open {
		padding: 0.4rem 0.75rem;
		color: var(--neon);
	}

	.chat {
		display: flex;
		flex-direction: column;
		inline-size: min(24rem, calc(100vw - 1.5rem));
		max-block-size: min(32rem, calc(100dvb - 5rem));
	}

	header,
	form {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.55rem;
	}

	header p {
		color: var(--neon);
	}

	.thread {
		display: grid;
		gap: 0.45rem;
		overflow: auto;
		min-block-size: 8rem;
		padding: 0.55rem;
		border-block: 1px solid var(--border-muted);
	}

	.hint,
	.user {
		color: var(--text-muted);
	}

	.error {
		color: var(--danger);
	}

	label {
		display: grid;
		gap: 0.2rem;
		flex: 1 1 auto;
		min-inline-size: 0;
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	input {
		inline-size: 100%;
		padding: 0.35rem 0.5rem;
	}

	button {
		padding: 0.35rem 0.6rem;
	}
</style>
