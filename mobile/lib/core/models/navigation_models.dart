class NavigationSessionDto {
  NavigationSessionDto({
    required this.sessionId,
    required this.status,
    required this.confidence,
    required this.recoveryMode,
    required this.voicePrompt,
    required this.buildingId,
    required this.buildingName,
    required this.floorId,
    required this.floorName,
    required this.startNodeId,
    required this.startNodeName,
    required this.currentNodeId,
    required this.currentNodeName,
    required this.destinationNodeId,
    required this.destinationNodeName,
    required this.progressEstimate,
    required this.totalDistanceMeters,
    required this.currentInstruction,
    required this.instructions,
    required this.availableDestinations,
    required this.entranceOptions,
    required this.recoveryOptions,
    required this.destinationSuggestions,
  });

  final String sessionId;
  final String status;
  final String confidence;
  final bool recoveryMode;
  final String voicePrompt;
  final String buildingId;
  final String buildingName;
  final String floorId;
  final String floorName;
  final String? startNodeId;
  final String? startNodeName;
  final String? currentNodeId;
  final String? currentNodeName;
  final String? destinationNodeId;
  final String? destinationNodeName;
  final double progressEstimate;
  final double totalDistanceMeters;
  final String currentInstruction;
  final List<NavigationInstructionDto> instructions;
  final List<DestinationDto> availableDestinations;
  final List<EntranceOptionDto> entranceOptions;
  final List<RecoveryOptionDto> recoveryOptions;
  final List<DestinationDto> destinationSuggestions;

  factory NavigationSessionDto.fromJson(Map<String, dynamic> json) {
    return NavigationSessionDto(
      sessionId: json['sessionId'] as String,
      status: json['status'] as String,
      confidence: json['confidence'] as String,
      recoveryMode: json['recoveryMode'] as bool,
      voicePrompt: json['voicePrompt'] as String,
      buildingId: json['buildingId'] as String,
      buildingName: json['buildingName'] as String,
      floorId: json['floorId'] as String,
      floorName: json['floorName'] as String,
      startNodeId: json['startNodeId'] as String?,
      startNodeName: json['startNodeName'] as String?,
      currentNodeId: json['currentNodeId'] as String?,
      currentNodeName: json['currentNodeName'] as String?,
      destinationNodeId: json['destinationNodeId'] as String?,
      destinationNodeName: json['destinationNodeName'] as String?,
      progressEstimate: (json['progressEstimate'] as num? ?? 0).toDouble(),
      totalDistanceMeters: (json['totalDistanceMeters'] as num? ?? 0).toDouble(),
      currentInstruction: json['currentInstruction'] as String? ?? json['voicePrompt'] as String? ?? '',
      instructions: (json['instructions'] as List<dynamic>? ?? [])
          .map((item) => NavigationInstructionDto.fromJson(item as Map<String, dynamic>))
          .toList(),
      availableDestinations: (json['availableDestinations'] as List<dynamic>? ?? [])
          .map((item) => DestinationDto.fromJson(item as Map<String, dynamic>))
          .toList(),
      entranceOptions: (json['entranceOptions'] as List<dynamic>? ?? [])
          .map((item) => EntranceOptionDto.fromJson(item as Map<String, dynamic>))
          .toList(),
      recoveryOptions: (json['recoveryOptions'] as List<dynamic>? ?? [])
          .map((item) => RecoveryOptionDto.fromJson(item as Map<String, dynamic>))
          .toList(),
      destinationSuggestions: (json['destinationSuggestions'] as List<dynamic>? ?? [])
          .map((item) => DestinationDto.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}

class NavigationInstructionDto {
  NavigationInstructionDto({
    required this.text,
    required this.order,
    required this.distanceMeters,
    required this.cumulativeDistanceMeters,
    required this.maneuver,
    required this.targetNodeId,
    required this.targetNodeName,
  });

  final String text;
  final int order;
  final double distanceMeters;
  final double cumulativeDistanceMeters;
  final String maneuver;
  final String? targetNodeId;
  final String? targetNodeName;

  factory NavigationInstructionDto.fromJson(Map<String, dynamic> json) {
    return NavigationInstructionDto(
      text: json['text'] as String,
      order: json['order'] as int? ?? 0,
      distanceMeters: (json['distanceMeters'] as num).toDouble(),
      cumulativeDistanceMeters: (json['cumulativeDistanceMeters'] as num? ?? 0).toDouble(),
      maneuver: json['maneuver'] as String,
      targetNodeId: json['targetNodeId'] as String?,
      targetNodeName: json['targetNodeName'] as String?,
    );
  }
}

class DestinationDto {
  DestinationDto({
    required this.nodeId,
    required this.aliasText,
    required this.nodeName,
    required this.type,
  });

  final String nodeId;
  final String aliasText;
  final String nodeName;
  final String type;

  factory DestinationDto.fromJson(Map<String, dynamic> json) {
    return DestinationDto(
      nodeId: json['nodeId'] as String,
      aliasText: (json['aliasText'] ?? json['alias']) as String,
      nodeName: json['nodeName'] as String,
      type: json['type'] as String? ?? 'room',
    );
  }
}

class EntranceOptionDto {
  EntranceOptionDto({
    required this.nodeId,
    required this.label,
    required this.type,
  });

  final String nodeId;
  final String label;
  final String type;

  factory EntranceOptionDto.fromJson(Map<String, dynamic> json) {
    return EntranceOptionDto(
      nodeId: json['nodeId'] as String,
      label: json['label'] as String,
      type: json['type'] as String? ?? 'entrance',
    );
  }
}

class RecoveryOptionDto {
  RecoveryOptionDto({
    required this.action,
    required this.label,
    required this.description,
    this.nodeId,
  });

  final String action;
  final String label;
  final String description;
  final String? nodeId;

  factory RecoveryOptionDto.fromJson(Map<String, dynamic> json) {
    return RecoveryOptionDto(
      action: json['action'] as String,
      label: json['label'] as String,
      description: json['description'] as String,
      nodeId: json['nodeId'] as String?,
    );
  }
}

class AssistantReplyDto {
  AssistantReplyDto({
    required this.responseText,
    this.rerouteAction,
    this.recoveryAction,
    this.newInstruction,
  });

  final String responseText;
  final String? rerouteAction;
  final String? recoveryAction;
  final String? newInstruction;

  factory AssistantReplyDto.fromJson(Map<String, dynamic> json) {
    return AssistantReplyDto(
      responseText: json['responseText'] as String? ?? '',
      rerouteAction: json['rerouteAction'] as String?,
      recoveryAction: json['recoveryAction'] as String?,
      newInstruction: json['newInstruction'] as String?,
    );
  }
}
