use crate::types::{BlockHeader, Hash, Transaction};
use libp2p::{
    gossipsub::{self, IdentTopic, MessageAuthenticity, GossipsubEvent},
    identity,
    swarm::{Swarm, SwarmEvent},
    PeerId,
};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use tokio::sync::mpsc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NetworkMessage {
    NewBlockHeader(BlockHeader),
    NewTransaction(Transaction),
    GetHeaders {
        locator_hashes: Vec<Hash>,
        stop_hash: Hash,
    },
    Headers(Vec<BlockHeader>),
    GetData {
        inv_type: u32,
        hash: Hash,
    },
    TransactionBroadcast(Transaction),
    Ping(u64),
    Pong(u64),
}

pub struct P2PNetwork {
    peer_id: PeerId,
    swarm: Swarm<libp2p::gossipsub::Behaviour>,
    connected_peers: HashSet<PeerId>,
    message_sender: mpsc::Sender<NetworkMessage>,
    message_receiver: mpsc::Receiver<NetworkMessage>,
}

impl P2PNetwork {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let id_keys = identity::Keypair::generate_ed25519();
        let peer_id = PeerId::from(id_keys.public());

        let transport = libp2p::tokio_development_transport(id_keys.clone())?;

        let gossipsub_config = gossipsub::ConfigBuilder::default()
            .heartbeat_interval(std::time::Duration::from_secs(1))
            .build()
            .map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;

        let gossipsub = gossipsub::Behaviour::new(
            MessageAuthenticity::Signed(id_keys),
            gossipsub_config,
        )?;

        let swarm = libp2p::swarm::SwarmBuilder::with_tokio_executor(
            transport,
            gossipsub,
            peer_id,
        )
        .build();

        let (message_sender, message_receiver) = mpsc::channel(100);

        Ok(P2PNetwork {
            peer_id,
            swarm,
            connected_peers: HashSet::new(),
            message_sender,
            message_receiver,
        })
    }

    pub fn peer_id(&self) -> PeerId {
        self.peer_id
    }

    pub fn subscribe_to_topics(&mut self) {
        let topics = [
            IdentTopic::new("block-headers"),
            IdentTopic::new("transactions"),
            IdentTopic::new("network"),
        ];

        for topic in topics {
            if let Err(e) = self.swarm.behaviour_mut().subscribe(&topic) {
                eprintln!("Failed to subscribe to topic: {}", e);
            }
        }
    }

    pub fn broadcast_block_header(&mut self, header: &BlockHeader) -> Result<(), Box<dyn std::error::Error>> {
        let message = NetworkMessage::NewBlockHeader(header.clone());
        let bytes = bincode::serialize(&message)?;
        let topic = IdentTopic::new("block-headers");
        self.swarm
            .behaviour_mut()
            .publish(topic, bytes)
            .map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;
        Ok(())
    }

    pub fn broadcast_transaction(&mut self, tx: &Transaction) -> Result<(), Box<dyn std::error::Error>> {
        let message = NetworkMessage::TransactionBroadcast(tx.clone());
        let bytes = bincode::serialize(&message)?;
        let topic = IdentTopic::new("transactions");
        self.swarm
            .behaviour_mut()
            .publish(topic, bytes)
            .map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;
        Ok(())
    }

    pub fn send_headers_request(
        &mut self,
        peer: PeerId,
        locator_hashes: Vec<Hash>,
        stop_hash: Hash,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let message = NetworkMessage::GetHeaders {
            locator_hashes,
            stop_hash,
        };
        let bytes = bincode::serialize(&message)?;
        let topic = IdentTopic::new("network");
        self.swarm
            .behaviour_mut()
            .publish(topic, bytes)
            .map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;
        Ok(())
    }

    pub async fn run(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        self.swarm
            .listen_on("/ip4/0.0.0.0/tcp/0".parse()?)?;

        loop {
            tokio::select! {
                event = self.swarm.select_next_some() => match event {
                    SwarmEvent::Behaviour(GossipsubEvent::Message { message, .. }) => {
                        if let Ok(network_msg) = bincode::deserialize::<NetworkMessage>(&message.data) {
                            let _ = self.message_sender.send(network_msg).await;
                        }
                    }
                    SwarmEvent::NewListenAddr { address, .. } => {
                        println!("Listening on {}", address);
                    }
                    SwarmEvent::ConnectionEstablished { peer_id, .. } => {
                        println!("Connected to peer: {}", peer_id);
                        self.connected_peers.insert(peer_id);
                    }
                    SwarmEvent::ConnectionClosed { peer_id, .. } => {
                        println!("Disconnected from peer: {}", peer_id);
                        self.connected_peers.remove(&peer_id);
                    }
                    _ => {}
                },
                Some(msg) = self.message_receiver.recv() => {
                    match msg {
                        NetworkMessage::NewBlockHeader(header) => {
                            let _ = self.broadcast_block_header(&header);
                        }
                        NetworkMessage::TransactionBroadcast(tx) => {
                            let _ = self.broadcast_transaction(&tx);
                        }
                        _ => {}
                    }
                }
            }
        }
    }

    pub fn connected_peers(&self) -> Vec<PeerId> {
        self.connected_peers.iter().cloned().collect()
    }
}

pub struct GossipProtocol {
    known_messages: HashSet<Hash>,
}

impl GossipProtocol {
    pub fn new() -> Self {
        GossipProtocol {
            known_messages: HashSet::new(),
        }
    }

    pub fn should_broadcast(&mut self, message_hash: Hash) -> bool {
        if self.known_messages.contains(&message_hash) {
            false
        } else {
            self.known_messages.insert(message_hash);
            true
        }
    }

    pub fn cleanup_old_messages(&mut self) {
        if self.known_messages.len() > 10000 {
            self.known_messages.clear();
        }
    }
}

impl Default for GossipProtocol {
    fn default() -> Self {
        Self::new()
    }
}
