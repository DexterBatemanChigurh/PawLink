import 'package:flutter/material.dart';
import '../../modules/auth/screens/login_screen.dart';
import '../../modules/auth/screens/register_screen.dart';
import '../../modules/home/screens/home_screen.dart';
import '../../modules/pets/screens/pet_detail_screen.dart';
import '../../modules/matches/screens/my_matches_screen.dart';

class AppRoutes {
  static const String splash = '/';
  static const String login = '/login';
  static const String register = '/register';
  static const String home = '/home';
  static const String petDetails = '/pet-details';
  static const String myMatches = '/my-matches';
  static const String receivedMatches = '/received-matches';

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case login:
        return MaterialPageRoute(builder: (_) => const LoginScreen());
      case register:
        return MaterialPageRoute(builder: (_) => const RegisterScreen());
      case home:
        return MaterialPageRoute(builder: (_) => const HomeScreen());
      case petDetails:
        final petId = settings.arguments as String;
        return MaterialPageRoute(
          builder: (_) => PetDetailScreen(petId: petId),
        );
      case myMatches:
        return MaterialPageRoute(
          builder: (_) => const MyMatchesScreen(),
        );
      case receivedMatches:
        return MaterialPageRoute(
          builder: (_) => MyMatchesScreen(received: true),
        );
      default:
        return MaterialPageRoute(builder: (_) => const LoginScreen());
    }
  }
}
