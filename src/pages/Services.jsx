import {
    Server,
    Database,
    Radio,
    HardDrive,
    ArrowRight,
    Activity,
    Zap,
    Cpu,
    BarChart3,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { services, redisStats, kafkaStats, dbStats } from '../data/mockData';
import './Services.css';

export default function Services() {
    return (
        <div className="services-page">
            <div className="page-header">
                <h1>Services</h1>
                <p>Microservice architecture overview and health monitoring</p>
            </div>

            {/* Architecture Diagram */}
            <div className="glass-card services-page__architecture animate-fade-in-up">
                <h3 className="services-page__section-title">
                    <Activity size={16} /> System Architecture
                </h3>
                <div className="services-page__diagram">
                    <div className="services-page__diagram-row">
                        <div className="services-page__node services-page__node--client">
                            <span className="services-page__node-icon">🌐</span>
                            <span className="services-page__node-label">Client / API</span>
                        </div>
                    </div>

                    <div className="services-page__arrow-down">
                        <ArrowRight size={16} className="services-page__arrow-icon-down" />
                    </div>

                    <div className="services-page__diagram-row services-page__diagram-row--services">
                        <div className="services-page__node services-page__node--service">
                            <span className="services-page__node-icon">📦</span>
                            <span className="services-page__node-label">Order Service</span>
                            <span className="services-page__node-port">:8081</span>
                        </div>
                        <div className="services-page__node services-page__node--service">
                            <span className="services-page__node-icon">📋</span>
                            <span className="services-page__node-label">Inventory Service</span>
                            <span className="services-page__node-port">:8082</span>
                        </div>
                        <div className="services-page__node services-page__node--service">
                            <span className="services-page__node-icon">🔔</span>
                            <span className="services-page__node-label">Notification Service</span>
                            <span className="services-page__node-port">:8083</span>
                        </div>
                    </div>

                    <div className="services-page__arrow-down">
                        <ArrowRight size={16} className="services-page__arrow-icon-down" />
                    </div>

                    <div className="services-page__diagram-row services-page__diagram-row--infra">
                        <div className="services-page__node services-page__node--kafka">
                            <span className="services-page__node-icon">⚡</span>
                            <span className="services-page__node-label">Apache Kafka</span>
                            <span className="services-page__node-detail">Event Broker</span>
                        </div>
                        <div className="services-page__node services-page__node--redis">
                            <span className="services-page__node-icon">🔴</span>
                            <span className="services-page__node-label">Redis</span>
                            <span className="services-page__node-detail">Cache + Rate Limit</span>
                        </div>
                        <div className="services-page__node services-page__node--pg">
                            <span className="services-page__node-icon">🐘</span>
                            <span className="services-page__node-label">PostgreSQL</span>
                            <span className="services-page__node-detail">Primary DB</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Service Cards */}
            <h3 className="services-page__section-title" style={{ marginTop: '24px', marginBottom: '16px' }}>
                <Server size={16} /> Microservices
            </h3>
            <div className="grid-3">
                {services.map((svc, i) => (
                    <div
                        key={svc.name}
                        className="glass-card services-page__service-card animate-fade-in-up"
                        style={{ animationDelay: `${0.1 * (i + 1)}s` }}
                    >
                        <div className="services-page__card-header">
                            <div>
                                <h4>{svc.name}</h4>
                                <span className="services-page__card-tech">{svc.tech}</span>
                            </div>
                            <StatusBadge status={svc.status} />
                        </div>
                        <p className="services-page__card-desc">{svc.description}</p>
                        <div className="services-page__card-metrics">
                            <div className="services-page__metric">
                                <span className="services-page__metric-label">Uptime</span>
                                <span className="services-page__metric-value">{svc.uptime}</span>
                            </div>
                            <div className="services-page__metric">
                                <span className="services-page__metric-label">Latency</span>
                                <span className="services-page__metric-value">{svc.latency}</span>
                            </div>
                            <div className="services-page__metric">
                                <span className="services-page__metric-label">Endpoints</span>
                                <span className="services-page__metric-value">{svc.endpoints}</span>
                            </div>
                            <div className="services-page__metric">
                                <span className="services-page__metric-label">Req/min</span>
                                <span className="services-page__metric-value">{svc.requestsPerMin}</span>
                            </div>
                        </div>
                        <div className="services-page__card-port">
                            Port {svc.port}
                        </div>
                    </div>
                ))}
            </div>

            {/* Infrastructure */}
            <h3 className="services-page__section-title" style={{ marginTop: '24px', marginBottom: '16px' }}>
                <Cpu size={16} /> Infrastructure
            </h3>
            <div className="grid-3">
                {/* Redis */}
                <div className="glass-card services-page__infra-card animate-fade-in-up stagger-4">
                    <div className="services-page__infra-header">
                        <div className="services-page__infra-icon services-page__infra-icon--redis">
                            <HardDrive size={20} />
                        </div>
                        <div>
                            <h4>Redis Cache</h4>
                            <StatusBadge status={redisStats.status} size="sm" />
                        </div>
                    </div>
                    <div className="services-page__infra-stats">
                        <div className="services-page__infra-stat">
                            <span className="services-page__metric-label">Hit Rate</span>
                            <span className="services-page__metric-value services-page__metric-value--green">{redisStats.hitRate}</span>
                        </div>
                        <div className="services-page__infra-stat">
                            <span className="services-page__metric-label">Total Keys</span>
                            <span className="services-page__metric-value">{redisStats.totalKeys.toLocaleString()}</span>
                        </div>
                        <div className="services-page__infra-stat">
                            <span className="services-page__metric-label">Memory</span>
                            <span className="services-page__metric-value">{redisStats.memoryUsed}</span>
                        </div>
                        <div className="services-page__infra-stat">
                            <span className="services-page__metric-label">Ops/sec</span>
                            <span className="services-page__metric-value">{redisStats.opsPerSec.toLocaleString()}</span>
                        </div>
                        <div className="services-page__infra-stat">
                            <span className="services-page__metric-label">Clients</span>
                            <span className="services-page__metric-value">{redisStats.connectedClients}</span>
                        </div>
                        <div className="services-page__infra-stat">
                            <span className="services-page__metric-label">Policy</span>
                            <span className="services-page__metric-value">{redisStats.evictionPolicy}</span>
                        </div>
                    </div>
                </div>

                {/* Kafka */}
                <div className="glass-card services-page__infra-card animate-fade-in-up stagger-5">
                    <div className="services-page__infra-header">
                        <div className="services-page__infra-icon services-page__infra-icon--kafka">
                            <Zap size={20} />
                        </div>
                        <div>
                            <h4>Apache Kafka</h4>
                            <StatusBadge status={kafkaStats.status} size="sm" />
                        </div>
                    </div>
                    <div className="services-page__infra-stats">
                        <div className="services-page__infra-stat">
                            <span className="services-page__metric-label">Brokers</span>
                            <span className="services-page__metric-value">{kafkaStats.brokers}</span>
                        </div>
                        <div className="services-page__infra-stat">
                            <span className="services-page__metric-label">Msg/sec</span>
                            <span className="services-page__metric-value services-page__metric-value--blue">{kafkaStats.messagesPerSec}</span>
                        </div>
                        <div className="services-page__infra-stat">
                            <span className="services-page__metric-label">Partitions</span>
                            <span className="services-page__metric-value">{kafkaStats.partitions}</span>
                        </div>
                        <div className="services-page__infra-stat">
                            <span className="services-page__metric-label">Consumers</span>
                            <span className="services-page__metric-value">{kafkaStats.consumerGroups}</span>
                        </div>
                        <div className="services-page__infra-stat">
                            <span className="services-page__metric-label">Lag</span>
                            <span className="services-page__metric-value">{kafkaStats.consumerLag}</span>
                        </div>
                        <div className="services-page__infra-stat">
                            <span className="services-page__metric-label">Replication</span>
                            <span className="services-page__metric-value">{kafkaStats.replicationFactor}x</span>
                        </div>
                    </div>
                    <div className="services-page__topics">
                        <span className="services-page__metric-label">Topics</span>
                        <div className="services-page__topic-list">
                            {kafkaStats.topics.map((t) => (
                                <span key={t} className="services-page__topic-tag">{t}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* PostgreSQL */}
                <div className="glass-card services-page__infra-card animate-fade-in-up stagger-6">
                    <div className="services-page__infra-header">
                        <div className="services-page__infra-icon services-page__infra-icon--pg">
                            <Database size={20} />
                        </div>
                        <div>
                            <h4>PostgreSQL</h4>
                            <StatusBadge status={dbStats.status} size="sm" />
                        </div>
                    </div>
                    <div className="services-page__infra-stats">
                        <div className="services-page__infra-stat">
                            <span className="services-page__metric-label">Version</span>
                            <span className="services-page__metric-value">{dbStats.type}</span>
                        </div>
                        <div className="services-page__infra-stat">
                            <span className="services-page__metric-label">Tables</span>
                            <span className="services-page__metric-value">{dbStats.tables}</span>
                        </div>
                        <div className="services-page__infra-stat">
                            <span className="services-page__metric-label">Indexes</span>
                            <span className="services-page__metric-value services-page__metric-value--purple">{dbStats.indexes}</span>
                        </div>
                        <div className="services-page__infra-stat">
                            <span className="services-page__metric-label">Connections</span>
                            <span className="services-page__metric-value">{dbStats.activeConnections}/{dbStats.maxConnections}</span>
                        </div>
                        <div className="services-page__infra-stat">
                            <span className="services-page__metric-label">DB Size</span>
                            <span className="services-page__metric-value">{dbStats.dbSize}</span>
                        </div>
                        <div className="services-page__infra-stat">
                            <span className="services-page__metric-label">Avg Query</span>
                            <span className="services-page__metric-value services-page__metric-value--green">{dbStats.avgQueryTime}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Docker Note */}
            <div className="glass-card services-page__docker animate-fade-in-up stagger-6" style={{ marginTop: '20px' }}>
                <div className="services-page__docker-content">
                    <span className="services-page__docker-icon">🐳</span>
                    <div>
                        <h4>Containerized with Docker</h4>
                        <p className="services-page__docker-text">
                            All microservices are containerized with Docker. Inter-service communication via REST APIs.
                            Kafka and Redis run as separate containers with persistent volumes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
